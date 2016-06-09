from django.conf.urls import patterns, url

__author__ = 'mphilpot'


urlpatterns = patterns('argos.apps.analytics.views',
    url(r'$', 'index', name='index'),
)