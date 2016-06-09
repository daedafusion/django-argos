import base64
import json
import logging
import multiprocessing
import re
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from django.shortcuts import render

# Create your views here.
import time
from argos.libs.clients.iconfactory import IconFactoryClient
from argos.libs.clients.ontology import OntologyClient
from argos.libs.clients.partition import PartitionClient
from argos.libs.clients.query import QueryClient, EditorClient

log = logging.getLogger(__name__)

@login_required
def index(request):

    return render(request, 'discovery.html', {
        'title': 'Test',
    })


@login_required
def ontology_description(request):

    ont = cache.get('ontology_description:%s' % request.user.userprofile.domain)

    if ont is None:

        client = OntologyClient(request.user.userprofile.token)

        ont = client.get_ontology_description(request.user.userprofile.domain)

        cache.set('ontology_description:%s' % request.user.userprofile.domain, ont)

    return JsonResponse(ont, safe=False)


@login_required
def knowledge_search(request):

    client = QueryClient(request.user.userprofile.token)

    query = {
        'query': request.POST.get('query', None),
        'queryType': 'application/knowledge-query',
        'limit': 25,
    }

    start = request.POST.get('start', None)
    end = request.POST.get('end', None)

    if start:
        query['after'] = long(start)
    if end:
        query['before'] = long(end)

    partitions = get_partitions(request.user)

    print(partitions)

    query['partitions'] = partitions

    sparql_results = client.query(request.user.userprofile.domain, query)

    # process results
    instances = {}

    for b in sparql_results['results']['bindings']:
        subject = b['s']['value']

        if subject in instances:
            continue

        instances[subject] = True

    sparql_results = client.describe(list(instances.keys()), partitions)

    nodes = build_nodes(sparql_results, request.user)

    return JsonResponse(nodes, safe=False)


# TODO would be nice not to have to pass the user around to these methods.  Should give UI cert credentials
def build_nodes(sparql_results, user):

    label_map = cache.get('ontology:%s:labels' % user.userprofile.domain)

    if not label_map:
        client = OntologyClient(user.userprofile.token)
        label_map = client.get_labels(user.userprofile.domain)
        cache.set('ontology:%s:labels' % user.userprofile.domain, label_map)

    instances = {}

    for b in sparql_results['results']['bindings']:
        subject = b['s']['value']
        predicate = b['p']['value']
        obj = b['o']['value']
        obj_type = b['o']['type']
        meta = json.loads(b['?']['value'])

        if subject not in instances:
            instance = {
                'anchor': subject,
                'properties': {},
                'references': {},
                'icon': '/static/img/question37.svg',  # specify default
                'label': None,
                'type': None,
            }
            instances[subject] = instance
        else:
            instance = instances[subject]

        if predicate == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":

            if not instance['label']:
                instance['label'] = label_map.get(obj, subject)

            instance['type'] = obj

        if predicate == "http://www.w3.org/2000/01/rdf-schema#label":
            instance['label'] = obj

        if obj_type == 'uri':
            if predicate in instance['references']:
                if obj in instance['references'][predicate]:
                    instance['references'][predicate][obj].update(meta)
                else:
                    instance['references'][predicate][obj] = meta
            else:
                instance['references'][predicate] = {obj: meta}
        else:
            if predicate in instance['properties']:
                if obj in instance['properties'][predicate]:
                    instance['properties'][predicate][obj].update(meta)
                else:
                    instance['properties'][predicate][obj] = meta
            else:
                instance['properties'][predicate] = {obj: meta}

    # Process Icons
    for subject, instance in instances.items():
        icon_rule = get_icon_rule(user, instance['type'])

        if icon_rule:

            icon_id = None

            for mod in icon_rule['modifiers']:
                if 'dataPropertyUri' not in mod or mod['dataPropertyUri'] is None and icon_id is None:
                    # Default Icon
                    icon_id = mod['iconId']
                else:
                    if mod['dataPropertyUri'] in instance['properties']:
                        for value in instance['properties'][mod['dataPropertyUri']].keys():
                            if mod['operator'] == 'EQUALS' and value == mod['value']:  #TODO Support other operators
                                icon_id = mod['iconId']

            # TODO Fix this!
            icon_spec = {
                'domain': user.userprofile.domain,
                'iconId': icon_id,
                'mod': None
            }

            instance['icon'] = reverse('iconfactory:get_icon', kwargs={
                'icon_spec': base64.urlsafe_b64encode(json.dumps(icon_spec))
            })

    return list(instances.values())


@login_required
def sparql_query(request):

    client = QueryClient(request.user.userprofile.token)

    partitions = get_partitions(request.user)

    sparql = request.POST.get('query', None)

    query = {
        'query': sparql,
        'queryType': 'application/sparql-query',
        'partitions': partitions
    }

    sparql_results = client.query(request.user.userprofile.domain, query)

    # process results
    instances = {}

    for b in sparql_results['results']['bindings']:
        subject = b['s']['value']

        if subject in instances:
            continue

        instances[subject] = True

    describe_results = client.describe(list(instances.keys()), partitions)

    sparql_results['results']['bindings'].extend(describe_results['results']['bindings'])

    nodes = build_nodes(sparql_results, request.user)

    return JsonResponse(nodes, safe=False)


@login_required
def describe_referenced(request):

    client = QueryClient(request.user.userprofile.token)

    partitions = get_partitions(request.user)

    uris = request.POST.get('uris', None)

    if uris:
        uris = json.loads(uris)
    else:
        uris = [request.POST.get('uri')]

    # Might need to do this because there is a chance in a normal query, some data properties might not come across due to limit
    describe_results = client.describe(uris, partitions)

    # TODO should be able to use the 'referenced' query endpoint, but it is not working

    if request.POST.get('expand_references', "true") == 'true':
        instances = {}

        for b in describe_results['results']['bindings']:
            predicate = b['p']['value']
            obj = b['o']['value']
            obj_type = b['o']['type']

            if predicate == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' or obj_type != 'uri' or obj in instances:
                continue

            instances[obj] = True

        sparql_results = client.describe(list(instances.keys()), partitions)

        # sparql_results = client.referenced([request.POST.get('uri')], partitions)

        sparql_results['results']['bindings'].extend(describe_results['results']['bindings'])
    else:
        sparql_results = describe_results

    nodes = build_nodes(sparql_results, request.user)

    return JsonResponse(nodes, safe=False)

@login_required
def follow_reference(request):

    client = QueryClient(request.user.userprofile.token)

    partitions = get_partitions(request.user)

    uri = request.POST.get('uri')
    direction = request.POST.get('direction')
    predicate = request.POST.get('predicate')

    if direction == "outgoing":
        sparql_results = client.trace_outgoing_predicates({uri: predicate}, partitions)
    elif direction == "incoming":
        sparql_results = client.trace_incoming_predicates({uri: predicate}, partitions)

    instances = {}

    for b in sparql_results['results']['bindings']:
        subject = b['s']['value']
        predicate = b['p']['value']
        obj = b['o']['value']

        if direction == "outgoing" and obj not in instances:
            instances[obj] = True

        elif direction == "incoming" and subject not in instances:
            instances[subject] = True

    describe_results = client.describe(list(instances.keys()), partitions)

    sparql_results['results']['bindings'].extend(describe_results['results']['bindings'])

    nodes = build_nodes(sparql_results, request.user)

    return JsonResponse(nodes, safe=False)


def mp_incoming(client, uris, partitions, output):
    results_incoming = client.incoming_predicates(uris, partitions)
    output.put({'incoming': results_incoming})


def mp_outgoing(client, uris, partitions, output):
    results_outgoing = client.outgoing_predicates(uris, partitions)
    output.put({'outgoing': results_outgoing})


@login_required
def node_contextmenu(request):

    uri = request.POST.get('uri')

    # TODO -- eventually this needs to be "partition list" specific
    result = cache.get('cmenu:%s:%s' % (uri, request.user.username))

    if result:
        return JsonResponse(result)

    label_map = cache.get('ontology:%s:labels' % request.user.userprofile.domain)

    if not label_map:
        client = OntologyClient(request.user.userprofile.token)
        label_map = client.get_labels(request.user.userprofile.domain)
        cache.set('ontology:%s:labels' % request.user.userprofile.domain, label_map)

    partitions = get_partitions(request.user)

    client = QueryClient(request.user.userprofile.token)

    # output = multiprocessing.Queue()
    #
    # processes = [
    #     multiprocessing.Process(target=mp_incoming, args=(client, [uri], partitions, output)),
    #     multiprocessing.Process(target=mp_outgoing, args=(client, [uri], partitions, output))
    # ]

    results_incoming = client.incoming_predicates([uri], partitions)
    results_outgoing = client.outgoing_predicates([uri], partitions)

    # for p in processes:
    #     p.start()
    #
    # for p in processes:
    #     p.join()
    #
    # results = [output.get() for p in processes]
    #
    # for r in results:
    #     if 'incoming' in r:
    #         results_incoming = r['incoming']
    #     elif 'outgoing' in r:
    #         results_outgoing = r['outgoing']

    incoming = {}
    outgoing = {}

    for b in results_incoming['results']['bindings']:
        predicate = b['p']['value']

        if predicate in incoming:
            incoming[predicate]['count'] += 1
        else:
            label = label_map.get(predicate, None)

            if label:
                # TODO pick the first label -- eventually need language detection
                label = label[0]['value']
                p = re.compile('"(.+)"(@.+)?')
                m = p.match(label)
                if m:
                    label = m.group(1)
            else:
                label = predicate[predicate.index("#"):]

            incoming[predicate] = {
                'predicate': predicate,
                'label': label,
                'count': 1
            }

    for b in results_outgoing['results']['bindings']:
        predicate = b['p']['value']
        obj_type = b['o']['type']

        if predicate == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" or obj_type != "uri":
            continue

        if predicate in outgoing:
            outgoing[predicate]['count'] += 1
        else:

            label = label_map.get(predicate, None)

            if label:
                # TODO pick the first label -- eventually need language detection
                label = label[0]['value']
                p = re.compile('"(.+)"(@.+)?')
                m = p.match(label)
                if m:
                    label = m.group(1)
            else:
                label = predicate[predicate.index("#"):]

            outgoing[predicate] = {
                'predicate': predicate,
                'label': label,
                'count': 1
            }

    result = {
        'incoming': list(incoming.values()),
        'outgoing': list(outgoing.values()),
    }

    cache.set('cmenu:%s:%s' % (uri, request.user.username), result, 60*30)

    return JsonResponse(result)


def strip_quotes(s):
    if s.startswith('"'):
        s = s[1:]
    if s.endswith('"'):
        s = s[:-1]

    return s


@login_required
def literal_prefix_lookup(request):

    uris = request.POST.get('uris')
    uris = json.loads(uris)
    literal_prefix = request.POST.get('lit')

    client = QueryClient(request.user.userprofile.token)

    result = client.literal_prefix_lookup(uris, literal_prefix)

    return JsonResponse(sorted([strip_quotes(x) for x in result]), safe=False)


@login_required
def editor_get(request):
    rdf_type = request.POST.get('rdfType', None)
    instance_uri = request.POST.get('instanceUri', None)
    is_reified = request.POST.get('isReified', 'false')

    if not rdf_type:
        return HttpResponseBadRequest()

    client = EditorClient(request.user.userprofile.token)

    if not instance_uri:
        editor_def = client.get_definition(rdf_type)
    else:
        partitions = get_partitions(request.user)

        editor_def = client.get_instance(rdf_type, instance_uri, partitions, is_reified)

    #Append icon to definition
    icon_rule = get_icon_rule(request.user, rdf_type)

    if icon_rule:

        # TODO Fix this!
        icon_spec = {
            'domain': request.user.userprofile.domain,
            'iconId': icon_rule['modifiers'][0]['iconId'],
            'mod': None
        }

        editor_def['definition']['icon'] = reverse('iconfactory:get_icon', kwargs={
            'icon_spec': base64.urlsafe_b64encode(json.dumps(icon_spec))
        })

    return JsonResponse(editor_def, safe=False)


@login_required
def editor_save(request):

    instance = request.POST.get('instance', None)
    target_partition = request.POST.get('target', None)

    if not instance:
        return HttpResponseBadRequest('No instance')

    instance = json.loads(instance)

    client = EditorClient(request.user.userprofile.token)

    # new reified instances have a uri but no partition data, so save them directly
    if 'uri' not in instance or 'partitionUnion' not in instance or len(instance['partitionUnion']) == 0:
        e = client.save_instance(instance, target_partition)
    else:
        e = client.update_instance(instance)

    return JsonResponse(e, safe=False)


@login_required
def editor_delete(request):
    pass





def get_partitions(user):
    workspace = cache.get('%s:workspace' % user.username, None)

    if not workspace:
        # TODO log warning
        partition_list = cache.get('partitions:%s:read' % user.username)
        if not partition_list:
            p_client = PartitionClient(user.userprofile.token)
            partition_list = p_client.get_readable_partitions(user.username)
            cache.set('partitions:%s:read' % user.username, partition_list)
        partitions = [x['uuid'] for x in partition_list]
    else:
        partitions = workspace['partitions']

    return partitions


def get_icon_rule(user, rdf_type):

    icons_cached = cache.get('icon:rules:%s' % user.userprofile.domain)

    if not icons_cached:
        client = IconFactoryClient(user.userprofile.token)
        icon_rules_list = client.get_rules(user.userprofile.domain)
        for r in icon_rules_list:
            try:
                cache.set('icon:rule:%s:%s' % (user.userprofile.domain, r['rdfType']), r)
            except Exception, e:
                log.error('Error setting cache for type %s' % r['rdfType'])

        cache.set('icon:rules:%s' % user.userprofile.domain, True)

    return cache.get('icon:rule:%s:%s' % (user.userprofile.domain, rdf_type))


def get_icon(user, icon_id):
    icons_cached = cache.get('icons:%s' % user.userprofile.domain)

    if not icons_cached:
        client = IconFactoryClient(user.userprofile.token)
        available_icons = client.get_icons(user.userprofile.domain)
        for i in available_icons:
            try:
                cache.set('icon:%s:%s' % (user.userprofile.domain, i['id']), i)
            except Exception, e:
                log.error('Error setting icon for type %s' % i['id'])

        cache.set('icons:%s' % user.userprofile.domain, True)

    return cache.get('icon:%s:%s' % (user.userprofile.domain, icon_id), '/static/img/question37.svg')