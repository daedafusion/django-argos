import base64
import json
from django.conf import settings
import requests
from argos.libs.discovery import Discovery

__author__ = 'mphilpot'


class EditorClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("query")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def get_definition(self, rdf_type):

        headers = {
            'accept': 'application/json',
            'authorization': self.token
        }

        r = requests.get('%s/editor/%s' % (self.url, base64.urlsafe_b64encode(rdf_type)), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def get_instance(self, rdf_type, instance_uri, partitions, is_reified='false'):

        headers = {
            'accept': 'application/json',
            'authorization': self.token
        }

        params = []

        if partitions:
            for p in partitions:
                params.append(('partition', p))

        params.append(('isReified', is_reified))

        r = requests.get('%s/editor/%s/%s' % (self.url, base64.urlsafe_b64encode(rdf_type), base64.urlsafe_b64encode(instance_uri)),
                          headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def save_instance(self, class_editor, target_partition):

        headers = {
            'accept': 'application/json',
            'authorization': self.token,
            'content-type': 'application/json',
        }

        r = requests.post('%s/editor/%s' % (self.url, target_partition), data=json.dumps(class_editor), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def update_instance(self, class_editor):

        headers = {
            'accept': 'application/json',
            'authorization': self.token,
            'content-type': 'application/json',
        }

        r = requests.put('%s/editor' % self.url, data=json.dumps(class_editor), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()


class QueryClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("query")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def query(self, domain, query):

        headers = {
            'accept': 'application/sparql-results+json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        params = []

        # if partitions:
        #     for p in partitions:
        #         params.append(('partition', p))

        r = requests.post('%s/query/%s' % (self.url, domain), data=json.dumps(query), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def describe(self, subject_list, partitions):

        headers = {
            'accept': 'application/sparql-results+json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        params = []

        if partitions:
            for p in partitions:
                params.append(('partition', p))

        r = requests.post('%s/describe' % self.url, data=json.dumps(subject_list), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def referenced(self, subject_list, partitions):
        headers = {
            'accept': 'application/sparql-results+json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        params = []

        if partitions:
            for p in partitions:
                params.append(('partition', p))

        r = requests.post('%s/describe/referenced' % self.url, data=json.dumps(subject_list), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def incoming_predicates(self, subject_list, partitions):
        headers = {
            'accept': 'application/sparql-results+json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        params = []

        if partitions:
            for p in partitions:
                params.append(('partition', p))

        r = requests.post('%s/describe/predicates/incoming' % self.url, data=json.dumps(subject_list), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def outgoing_predicates(self, subject_list, partitions):
        headers = {
            'accept': 'application/sparql-results+json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        params = []

        if partitions:
            for p in partitions:
                params.append(('partition', p))

        r = requests.post('%s/describe/predicates/outgoing' % self.url, data=json.dumps(subject_list), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def trace_incoming_predicates(self, subject_predicate_pairs, partitions):
        headers = {
            'accept': 'application/sparql-results+json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        params = []

        if partitions:
            for p in partitions:
                params.append(('partition', p))

        r = requests.post('%s/describe/predicates/trace/incoming' % self.url, data=json.dumps(subject_predicate_pairs), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def trace_outgoing_predicates(self, subject_predicate_pairs, partitions):
        headers = {
            'accept': 'application/sparql-results+json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        params = []

        if partitions:
            for p in partitions:
                params.append(('partition', p))

        r = requests.post('%s/describe/predicates/trace/outgoing' % self.url, data=json.dumps(subject_predicate_pairs), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def distinct_predicate_values(self, predicate, partitions):
        headers = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        params = []

        if partitions:
            for p in partitions:
                params.append(('partition', p))

        r = requests.post('%s/describe/predicate/values' % self.url, data=predicate, headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def literal_prefix_lookup(self, predicates, literal_prefix):
        headers = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        data = {
            'predicates': predicates,
            'literalPrefix': literal_prefix
        }

        # params = []
        #
        # if partitions:
        #     for p in partitions:
        #         params.append(('partition', p))

        r = requests.post('%s/query/literal/prefix' % self.url, data=json.dumps(data), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()