
from os.path import join, normpath

from common import *

########## DEBUG CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#debug
DEBUG = True

# See: https://docs.djangoproject.com/en/dev/ref/settings/#template-debug
TEMPLATE_DEBUG = DEBUG
########## END DEBUG CONFIGURATION

########## DATABASE CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': normpath(join(BASE_DIR, 'default.db')),
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
    }
}
########## END DATABASE CONFIGURATION

########## CACHE CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#caches
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.memcached.PyLibMCCache',
        'LOCATION': '192.168.99.100:11211',
        'TIMEOUT': 3600
    }
}
########## END CACHE CONFIGURATION

########## TOOLBAR CONFIGURATION
# See: https://github.com/django-debug-toolbar/django-debug-toolbar#installation
INSTALLED_APPS += (
    'debug_toolbar',
)

# See: https://github.com/django-debug-toolbar/django-debug-toolbar#installation
INTERNAL_IPS = ('127.0.0.1',)

# See: https://github.com/django-debug-toolbar/django-debug-toolbar#installation
MIDDLEWARE_CLASSES += (
    'debug_toolbar.middleware.DebugToolbarMiddleware',
)

DEBUG_TOOLBAR_CONFIG = {
    'INTERCEPT_REDIRECTS': False,
}
########## END TOOLBAR CONFIGURATION