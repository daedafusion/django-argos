from argos.libs.discovery import Discovery
from django.conf import settings
import requests


class ResearchClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("collection-central")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def get_research(self):
        headers = {
            'accept': 'application/json',
            'authorization': self.token
        }

        r = requests.get('%s/research' % self.url, headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()


    # def save_partition(self, partition):
    #     headers = {
    #         'accept': 'application/json',
    #         'content-type': 'application/json',
    #         'authorization': self.token,
    #     }
    #
    #     r = requests.post('%s/partition' % self.url, data=json.dumps(partition), headers=headers, cert=self.cert, verify=self.verify)
    #
    #     r.raise_for_status()
    #
    #     return r.json()

    def save_request(self, research_request):
        headers = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': self.token,
        }

        r = requests.post('%s/research' % self.url, data=json.dumps(research_request), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()