from django.conf import settings
import requests
from argos.libs.discovery import Discovery

__author__ = 'mphilpot'


class AniketosClient(object):

    def __init__(self, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("aniketos")
        else:
            self.url = url

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def authenticate(self, username, domain=None, password=None):
        headers = {
            'x-identity-password': password,
            'accept': 'application/json',
        }

        u = '%s/authenticate/%s' % (self.url, username)

        if domain is not None:
            params = {'domain': domain}
        else:
            params = None

        r = requests.post(u, headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def authenticate_reset(self, username, domain=None, old_password=None, new_password=None):
        headers = {
            'x-identity-password': new_password,
            'x-identity-oldpassword': old_password,
            'accept': 'application/json',
        }

        u = '%s/authenticate/reset/%s' % (self.url, username)

        if domain is not None:
            params = {'domain': domain}
        else:
            params = None

        r = requests.post(u, headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def logout(self, token):
        r = requests.post('%s/logout/%s' % (self.url, token), cert=self.cert, verify=self.verify)

    def identity(self, token):
        headers = {
            'accept': 'application/json',
        }

        r = requests.get('%s/identity/self/%s' % (self.url, token), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def get_identity(self, token, username, domain=None):
        headers = {
            'authorization': token,
            'accept': 'application/json',
        }

        u = '%s/identity/%s' % (self.url, username)

        if domain is not None:
            params = {'domain': domain}
        else:
            params = None

        r = requests.get(u, headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def password(self, token, new_password):
        headers = {
            'accept': 'application/json',
            'x-identity-password': new_password,
        }

        r = requests.post('%s/identity/self/password/%s' % (self.url, token), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def set_password(self, token, new_password, username, domain=None):
        headers = {
            'authorization': token,
            'x-identity-password': new_password,
            'accept': 'application/json',
        }

        u = '%s/identity/password/%s' % (self.url, username)

        if domain is not None:
            params = {'domain': domain}
        else:
            params = None

        r = requests.post(u, headers=headers, params=params, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def is_token_valid(self, token):
        return self.token_validation(token)['valid']

    def token_validation(self, token, ping_session=True):
        headers = {
            'accept': 'application/json'
        }

        if ping_session:
            u = '%s/token/%s'
        else:
            u = '%s/token/%s/noping'

        r = requests.post(u % (self.url, token), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def is_authorized(self, token, username, action, uri):

        # TODO Fucking XACML
        template = """
                <?xml version="1.0" encoding="UTF-8"?>
                <Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" ReturnPolicyIdList="false" CombinedDecision="false">
                   <Attributes Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject" >
                     <Attribute IncludeInResult="false" AttributeId="urn:oasis:names:tc:xacml:1.0:subject:subject-id">
                      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">%s</AttributeValue>
                    </Attribute>
                  </Attributes>
                  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource">
                    <Attribute IncludeInResult="false" AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id">
                      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">%s</AttributeValue>
                    </Attribute>
                  </Attributes>
                  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
                    <Attribute IncludeInResult="false" AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id">
                      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">%s</AttributeValue>
                    </Attribute>
                  </Attributes>
                </Request>
                """

        request = template % (username, uri, action)

        headers = {
            'authorization': token,
            'content-type': 'application/xml',
            'accept': 'application/xml',
        }

        r = requests.post('%s/authorization' % self.url, data=request, headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        # TODO
        return '<Decision>Permit</Decision>' in r.text