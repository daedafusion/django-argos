from django.conf.urls import patterns, url

__author__ = 'mphilpot'


urlpatterns = patterns('argos.apps.cases.views',
    url(r'$', 'index', name='index'),
)