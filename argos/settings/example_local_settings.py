__author__ = 'mphilpot'

from dev import *

#SERVICE_DISCOVERY_PROVIDER='argos.libs.discovery.EtcdDiscoveryProvider'

ETCD_HOSTNAME = '192.168.59.103'
BROKER_URL = 'amqp://guest:guest@192.168.59.103:5672/'

AUTHENTICATION_BACKENDS = (
    #'argos.apps.common.auth.AniketosAuthentication',
    'django.contrib.auth.backends.ModelBackend',
)

# TODO this should be retrieved from distributed config
JWT_SHARED_SECRET = 'qrllxoyy2x2bnsp84yjoi5wujrnqun6y0lspeu28'