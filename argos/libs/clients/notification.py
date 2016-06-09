import json
from argos.libs.discovery import Discovery
from django.conf import settings
import requests

__author__ = 'mphilpot'


class TaskClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("notification")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def save(self, task):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
            'content-type': 'application/json',
        }

        r = requests.post('%s/task' % self.url, data=json.dumps(task), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def update(self, task):
        headers = {
            'authorization': self.token,
            'content-type': 'application/json',
        }

        r = requests.put('%s/task' % self.url, data=json.dumps(task), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()


    def get_list(self, username, offset=None, limit=None):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        params = []

        if offset:
            params.append(('offset', offset))
        if limit:
            params.append(('limit', limit))

        r = requests.get('%s/notification' % self.url, headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def delete(self, uuid):
        headers = {
            'authorization': self.token,
        }

        r = requests.delete('%s/task/%s' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

    def get(self, uuid):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.get('%s/task/%s' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()


class NotificationClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("notification")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def get_list(self, username, offset=None, limit=None):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        params = []

        if offset:
            params.append(('offset', offset))
        if limit:
            params.append(('limit', limit))

        r = requests.get('%s/notification/%s' % (self.url, username), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def get_num_unread(self, username):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.get('%s/notification/%s/unread' % (self.url, username), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def mark_read(self, uuid):
        headers = {
            'authorization': self.token,
        }

        r = requests.delete('%s/notification/%s' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

    def get(self, uuid):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.get('%s/notification/%s' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()