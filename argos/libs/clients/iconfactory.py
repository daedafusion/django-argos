from django.conf import settings
import requests
from argos.libs.discovery import Discovery

__author__ = 'mphilpot'


class IconFactoryClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("iconfactory")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def get_png_icon(self, domain, icon_id, size=None, mod=None):

        headers = {
            'accept': 'image/png',
            'x-icon-domain': domain,
            'authorization': self.token,
        }

        if size:
            headers['x-icon-size'] = size
        if mod:
            headers['x-icon-modifier'] = mod

        r = requests.get('%s/runtime/%s' % (self.url, icon_id), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.content

    def get_svg_icon(self, domain, icon_id, size=None, mod=None):

        headers = {
            'accept': 'image/svg+xml',
            'x-icon-domain': domain,
            'authorization': self.token,
        }

        if size:
            headers['x-icon-size'] = size
        if mod:
            headers['x-icon-modifier'] = mod

        r = requests.get('%s/runtime/%s' % (self.url, icon_id), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.content

    def get_rules(self, domain):

        headers = {
            'accept': 'application/json',
            'x-icon-domain': domain,
            'authorization': self.token,
        }

        r = requests.get('%s/customize/rules' % self.url, headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def get_icons(self, domain):
        headers = {
            'accept': 'application/json',
            'x-icon-domain': domain,
            'authorization': self.token,
        }

        r = requests.get('%s/customize/icons' % self.url, headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()