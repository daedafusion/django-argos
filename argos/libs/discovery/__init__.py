import base64
import json
import random
from django.conf import settings
import etcd

__author__ = 'mphilpot'


def import_class(c):
    d = c.rfind(".")
    classname = c[d+1:len(c)]
    m = __import__(c[0:d], globals(), locals(), [classname])
    return getattr(m, classname)


class Discovery(object):

    def __init__(self):

        p = getattr(settings, "SERVICE_DISCOVERY_PROVIDER", "argos.libs.discovery.SettingsDiscoveryProvider")

        self.provider = import_class(p)()

    def get_instance(self, service_name):
        return self.provider.get_instance(service_name)

    def get_url(self, service_name):
        return self.provider.get_url(service_name)


class DiscoveryException(Exception):
    pass


class DiscoveryProvider(object):

    def get_instance(self, service_name):
        raise NotImplementedError("Provider Must Implement")

    def get_url(self, service_name):
        raise NotImplementedError("Provider Must Implement")


class SettingsDiscoveryProvider(DiscoveryProvider):

    def get_instance(self, service_name):
        discovery = getattr(settings, 'SERVICE_DISCOVERY', {})

        if service_name in discovery:
            services = discovery[service_name]

            i = random.randint(0, len(services)-1)

            return services[i]

        else:
            raise DiscoveryException("Service '%s' not configured in SERVICE_DISCOVERY" % service_name)

    def get_url(self, service_name):
        return self.get_instance(service_name)


class EtcdDiscoveryProvider(DiscoveryProvider):

    def __init__(self):

        self.ETCD_HOSTNAME = getattr(settings, 'ETCD_HOSTNAME', "localhost")
        self.ETCD_SD_PREFIX = getattr(settings, 'ETCD_SD_PREFIX', "/discovery")

        self.client = etcd.Client(host=self.ETCD_HOSTNAME)

    def get_instance(self, service_name):

        instance = None

        base_path = '%s/%s' % (self.ETCD_SD_PREFIX, service_name)

        r = self.client.read(base_path)

        instances = []

        for node in r.children:
            instances.append(node.key)

        i = instances[random.randint(0, len(instances)-1)]

        r = self.client.get('%s/instance' % i)

        return json.loads(base64.b64decode(r.value))

    def get_url(self, service_name):
        instance = self.get_instance(service_name)

        instance['scheme'] = 'http'

        if 'ssl-port' in instance:
            instance['scheme'] = 'https'

        parts = instance['uriSpec']['parts']

        u = ""

        for p in parts:
            if p['variable']:
                obj = instance[p['value']]
                if obj is not None:
                    u += str(obj)
            else:
                u += p['value']

        return u