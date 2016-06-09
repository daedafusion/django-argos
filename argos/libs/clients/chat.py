import json
from argos.libs.discovery import Discovery
from django.conf import settings
import requests

__author__ = 'mphilpot'


class ChatClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("chat")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def get_room(self, target, target_type=None):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        params = [('target', target)]
        if target_type:
            params.append(('type', target_type))

        r = requests.get('%s/room' % self.url, headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def create_room(self, room):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
            'content-type': 'application/json',
        }

        r = requests.post('%s/room' % self.url, data=json.dumps(room), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def compose(self, uuid, message):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
            'content-type': 'application/json',
        }

        r = requests.post('%s/room/%s' % (self.url, uuid), data=json.dumps(message), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def get_conversation(self, uuid, limit=20, offset=None):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        params = [('limit', limit)]
        if offset:
            params.append(('offset', offset))

        r = requests.get('%s/room/%s' % (self.url, uuid), headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()