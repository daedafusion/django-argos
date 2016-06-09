from django.conf import settings
import requests
from argos.libs.discovery import Discovery

__author__ = 'mphilpot'


class OntologyClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("ontology")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def get_ontology_description(self, domain, uuids=None):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        params = []

        if uuids:
            for uuid in uuids:
                params.append(('uuid', uuid))

        r = requests.get('%s/ontologies/%s' % (self.url, domain), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def get_labels(self, domain, uuids=None):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        params = []

        if uuids:
            for uuid in uuids:
                params.append(('uuid', uuid))

        r = requests.get('%s/ontologies/%s/labels' % (self.url, domain), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()


class OntologyAdminClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("ontology")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def get_ontology_meta(self, domain):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.get('%s/admin/ontologies/meta/%s' % (self.url, domain), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def upload_ontology_rdf(self, domain, rdf):
        headers = {
            'accept': 'application/json',
            'content-type': 'text/xml',
            'authorization': self.token,
        }

        r = requests.post('%s/admin/ontology/%s' % (self.url, domain), data=rdf, headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()