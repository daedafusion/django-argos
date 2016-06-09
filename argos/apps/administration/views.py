import json
from argos.libs.clients.partition import PartitionClient
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse
from django.shortcuts import render

# Create your views here.
@login_required
def domain(request):

    return render(request, 'domain.html', {
        'title': 'Test',
    })


@login_required
def site(request):

    return render(request, 'site.html', {
        'title': 'Test',
    })


@login_required
def partitions(request):

    return render(request, 'partitions.html', {
        'title': 'Test',
    })


@login_required
def partitions_table(request):

    client = PartitionClient(request.user.userprofile.token)

    admin = client.get_admin_partitions(request.user.username, system_tags=['user'])

    p_map = {}

    for p in admin:
        redacted = []
        for t in p['tags']:
            if not t.startswith(getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#')):
                redacted.append(t)
        p_map[p['uuid']] = [
            p['uuid'],
            p['name'],
            ', '.join(redacted),
        ]

    return JsonResponse({"data": p_map.values()}, safe=False)

#
# @login_required
# def partitions_save(request):
#
#     client = PartitionClient(request.user.userprofile.token)
#
#     partition = {
#         'name': request.POST.get('name', ''),
#         'read': [
#             request.user.username,
#             "%s%s" % (getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#'), request.user.userprofile.domain)
#         ],
#         'write': [
#             request.user.username,
#             "%s%s" % (getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#'), request.user.userprofile.domain)
#         ],
#         'admin': [
#             request.user.username,
#             "%s%s" % (getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#'), request.user.userprofile.domain),
#             getattr(settings, 'GLOBAL_ADMIN_STRING', '#global')
#         ],
#         'tags': [x.strip() for x in request.POST.get('tags', '').split(',')],
#         'creator': request.user.username,
#         'domain': request.user.userprofile.domain,
#     }
#
#     partition = client.save_partition(partition)
#
#     return JsonResponse(partition, safe=False)


@login_required
def partitions_get(request):

    client = PartitionClient(request.user.userprofile.token)

    uuid = request.POST.get('uuid', None)

    if not uuid:
        return HttpResponseBadRequest()

    partition = client.get_partition(uuid)

    # Strip out strings that ui isn't allowed to modify
    for field in ["read", "write", "admin"]:
        redacted = []
        for r in partition[field]:
            if not r.startswith(getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#')):
                redacted.append(r)
        partition[field] = redacted

    return JsonResponse(partition, safe=False)


@login_required
def partitions_delete(request):

    client = PartitionClient(request.user.userprofile.token)

    uuid = request.POST.get('uuid', None)

    if not uuid:
        return HttpResponseBadRequest()

    client.delete_partition(uuid)

    return HttpResponse()


@login_required
def partitions_permissions_dialog(request):

    # TODO need identity client to get people in domain

    # TODO need permission check to see if this user can share globally

    return render(request, 'ajax/partition_permissions_dialog.html', {
        'domain': request.user.userprofile.domain,
        'identities': [],
        'global': request.user.has_perm('POST|partition:global'),
    })


@login_required
def partitions_props(request):

    client = PartitionClient(request.user.userprofile.token)

    if request.method == 'POST':
        pass

    uuid = request.GET.get('uuid', None)

    if not uuid:
        return HttpResponseBadRequest()

    partition = client.get_partition(uuid)

    # Strip out strings that ui isn't allowed to modify
    for field in ["read", "write", "admin", "tags"]:
        redacted = []
        for r in partition[field]:
            if not r.startswith(getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#')):
                redacted.append(r)
        partition[field] = redacted

    return render(request, 'ajax/partition_props.html', {
        'partition': partition,
    })

@login_required
def partitions_new(request):

    if request.method == 'POST':
        client = PartitionClient(request.user.userprofile.token)

        partition = {
            'name': request.POST.get('name', ''),
            'read': [
                request.user.username,
                "%s%s" % (getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#'), request.user.userprofile.domain)
            ],
            'write': [
                request.user.username,
                "%s%s" % (getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#'), request.user.userprofile.domain)
            ],
            'admin': [
                request.user.username,
                "%s%s" % (getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#'), request.user.userprofile.domain),
                getattr(settings, 'GLOBAL_ADMIN_STRING', '#global')
            ],
            'tags': [x.strip() for x in request.POST.get('tags', '').split(',')],
            'systemTags': ['user'],
            'creator': request.user.username,
            'domain': request.user.userprofile.domain,
        }

        partition = client.save_partition(partition)

        return JsonResponse(partition, safe=False)

    return render(request, 'ajax/new_partition_form.html', {})


@login_required
def partitions_update(request):

    client = PartitionClient(request.user.userprofile.token)

    partition = request.POST.get('partition', None)

    if not partition:
        return HttpResponseBadRequest()

    # The admin strings in read, write, admin have been stripped because they are not edible by the user
    # The server will perform the merge on update
    partition = json.loads(partition)

    partition['read'].append("%s%s" % (getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#'), request.user.userprofile.domain))
    partition['write'].append("%s%s" % (getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#'), request.user.userprofile.domain))
    partition['write'].append(getattr(settings, 'GLOBAL_ADMIN_STRING', '#global'))
    partition['admin'].append("%s%s" % (getattr(settings, 'DOMAIN_ADMIN_PREFIX', '#'), request.user.userprofile.domain))
    partition['admin'].append(getattr(settings, 'GLOBAL_ADMIN_STRING', '#global'))
    partition['tags'] = [x.strip() for x in partition['tags'].split(',')]

    print(partition)

    client.update_partition(partition)

    return HttpResponse()


@login_required
def partitions_list(request):

    client = PartitionClient(request.user.userprofile.token)

    op = request.GET.get('op', 'read')

    if op == 'write':
        pl = client.get_writable_partitions(request.user.username)
    elif op == 'admin':
        pl = client.get_admin_partitions(request.user.username, system_tags=['user'])
    else:
        pl = client.get_readable_partitions(request.user.username)

    return JsonResponse(pl, safe=False)