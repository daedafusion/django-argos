import json
from django.conf import settings
import requests
from argos.libs.discovery import Discovery

__author__ = 'mphilpot'


class PartitionClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("partition")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def save_partition(self, partition):
        headers = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        r = requests.post('%s/partition' % self.url, data=json.dumps(partition), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def update_partition(self, partition):
        headers = {
            'content-type': 'application/json',
            'authorization': self.token,
        }

        r = requests.put('%s/partition/%s' % (self.url, partition['uuid']), data=json.dumps(partition), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

    def get_readable_partitions(self, username, tags=None, system_tags=None):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        params = []

        if tags:
            for t in tags:
                params.append(('tag', t))
        if system_tags:
            for t in system_tags:
                params.append(('system', t))

        r = requests.get('%s/partition/user/%s/read' % (self.url, username), params=params, headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def get_writable_partitions(self, username, tags=None, system_tags=None):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        params = []

        if tags:
            for t in tags:
                params.append(('tag', t))
        if system_tags:
            for t in system_tags:
                params.append(('system', t))

        r = requests.get('%s/partition/user/%s/write' % (self.url, username), params=params, headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def get_admin_partitions(self, username, tags=None, system_tags=None):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        params = []

        if tags:
            for t in tags:
                params.append(('tag', t))
        if system_tags:
            for t in system_tags:
                params.append(('system', t))

        r = requests.get('%s/partition/user/%s/admin' % (self.url, username), params=params, headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def get_partition(self, uuid):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.get('%s/partition/%s' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def delete_partition(self, uuid):
        headers = {
            'authorization': self.token,
        }

        r = requests.delete('%s/partition/%s' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()