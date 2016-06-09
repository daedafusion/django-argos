"""
Django settings for argos project.

For more information on this file, see
https://docs.djangoproject.com/en/dev/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/dev/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import copy
from django.core.urlresolvers import reverse_lazy
import os
from os.path import abspath, basename, dirname, join, normpath
from sys import path
import djcelery

djcelery.setup_loader()

#### PATH CONFIGURATION
BASE_DIR = dirname(dirname(__file__))

SITE_ROOT = dirname(BASE_DIR)

SITE_NAME = basename(BASE_DIR)

path.append(BASE_DIR)


#### DEBUG CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#debug
DEBUG = False

# See: https://docs.djangoproject.com/en/dev/ref/settings/#template-debug
TEMPLATE_DEBUG = DEBUG
#### END DEBUG

# Database
# https://docs.djangoproject.com/en/dev/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/dev/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '!&%g^bu)o#+a_61q(i9n7cdt%$cdah)b3k*ubh9$ap&e4qv*#8'


ALLOWED_HOSTS = []

MIDDLEWARE_CLASSES = (
    # Use GZip compression to reduce bandwidth.
    'django.middleware.gzip.GZipMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    #'user_sessions.middleware.SessionMiddleware',  # Can't use this with swampdragon yet

    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django_otp.middleware.OTPMiddleware',

    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'argos.apps.common.auth.AniketosTokenValidationMiddleware',
)

ROOT_URLCONF = 'argos.urls'

WSGI_APPLICATION = 'argos.wsgi.application'

# Internationalization
# https://docs.djangoproject.com/en/dev/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/dev/howto/static-files/
STATIC_ROOT = normpath(join(BASE_DIR, 'static'))

STATIC_URL = '/static/'

# See: https://docs.djangoproject.com/en/dev/ref/contrib/staticfiles/#std:setting-STATICFILES_DIRS
STATICFILES_DIRS = (
    normpath(join(BASE_DIR, 'assets')),
)

# See: https://docs.djangoproject.com/en/dev/ref/contrib/staticfiles/#staticfiles-finders
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'djangobower.finders.BowerFinder',
    'compressor.finders.CompressorFinder',
)

########## TEMPLATE CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#template-context-processors
TEMPLATE_CONTEXT_PROCESSORS = (
    'django.contrib.auth.context_processors.auth',
    'django.core.context_processors.debug',
    'django.core.context_processors.i18n',
    'django.core.context_processors.media',
    'django.core.context_processors.static',
    'django.core.context_processors.tz',
    'django.contrib.messages.context_processors.messages',
    'django.core.context_processors.request',
)

# See: https://docs.djangoproject.com/en/dev/ref/settings/#template-loaders
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

# See: https://docs.djangoproject.com/en/dev/ref/settings/#template-dirs
TEMPLATE_DIRS = (
    normpath(join(BASE_DIR, 'templates')),
)
########## END TEMPLATE CONFIGURATION

# Application definition

DJANGO_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
)

THIRD_PARTY_APPS = (
    #'user_sessions',  # Need to write a new swampdragon HttpDataConnection to support this
    'compressor',
    'djangobower',
    'django_js_reverse',
    'djcelery',
    'django_otp',
    'django_otp.plugins.otp_static',
    'django_otp.plugins.otp_totp',
    'two_factor',
    'password_reset',
    'bootstrapform',
    'swampdragon',
)

LOCAL_APPS = (
    'argos.apps.common',
    'argos.apps.notifications',
    'argos.apps.discovery',
    'argos.apps.assets',
    'argos.apps.analytics',
    'argos.apps.ingest',
    'argos.apps.cases',
    'argos.apps.reports',
    'argos.apps.administration',
)

INSTALLED_APPS = DJANGO_APPS + LOCAL_APPS + THIRD_PARTY_APPS

########## LOGGING CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
    'require_debug_false': {
        '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler'
        }
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'propagate': True,
            'level': 'INFO',
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': True,
        },
        'argos.security': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        }
    }
}

local_logger_conf = {
    'handlers': ['console',],
    'level': 'INFO',
}

LOGGING['loggers'].update({ app: copy.deepcopy(local_logger_conf) for app in LOCAL_APPS })

########## END LOGGING CONFIGURATION

########## COMPRESSION CONFIGURATION
# See: http://django_compressor.readthedocs.org/en/latest/settings/#django.conf.settings.COMPRESS_ENABLED
COMPRESS_ENABLED = True

# See: http://django-compressor.readthedocs.org/en/latest/settings/#django.conf.settings.COMPRESS_CSS_HASHING_METHOD
COMPRESS_CSS_HASHING_METHOD = 'content'

# See: http://django_compressor.readthedocs.org/en/latest/settings/#django.conf.settings.COMPRESS_CSS_FILTERS
COMPRESS_CSS_FILTERS = [
    'compressor.filters.template.TemplateFilter',
    'compressor.filters.css_default.CssAbsoluteFilter',
]

# See: http://django_compressor.readthedocs.org/en/latest/settings/#django.conf.settings.COMPRESS_JS_FILTERS
COMPRESS_JS_FILTERS = [
    'compressor.filters.template.TemplateFilter',
]
########## END COMPRESSION CONFIGURATION

########## BOWER
BOWER_COMPONENTS_ROOT = join(BASE_DIR, 'components')

BOWER_INSTALLED_APPS = (
    'jquery#2.1.1',
    'underscore#1.8.3',
    'bootstrap#3.2.0',
    'fontawesome#4.1.0',
    'd3#3.4.11',
    'DataTables#1.10.2',
    'datatables-bootstrap3#0.1',
    'jeresig/jquery.hotkeys',
    'jqueryui#1.11.2',  # For Widget Factory
    'leaflet#0.7.3',
    'messenger#1.4.1',
    'jQuery-contextMenu#1.6.6',
    'typeahead.js#0.10.5',
    'requirejs#2.1.15',
    'sprintf.js#1.0.1',
    'jquery-ui-bootstrap',
    'moment#2.8.3',
    'jgrowl#1.4.0',
    'js-base64#2.1.5',
    'jstree#3.0.9',
    'jstree-bootstrap-theme#1.0.1',
    'bootstrap-select#1.6.3',
    'bootstrap-daterangepicker#1.3.17',
    'tagsinput#0.5',
    'bootbox#4.4.0',
    'gridstack#310c854d8ca085ef65eed44afef554aa6df8f1bf', #v0.2.2 doesn't yet have remove_widget detach parameter
)
########## END BOWER

LOGIN_URL = reverse_lazy('two_factor:login')
LOGIN_REDIRECT_URL = '/'

#SESSION_ENGINE = 'user_sessions.backends.db'

#SWAMP_DRAGON_CONNECTION = ('swampdragon.connections.sockjs_connection.DjangoSubscriberConnection', '/data')
SWAMP_DRAGON_CONNECTION = ('swampdragon_auth.socketconnection.HttpDataConnection', '/data')