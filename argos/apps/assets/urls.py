from django.conf.urls import patterns, url

__author__ = 'mphilpot'


urlpatterns = patterns('argos.apps.assets.views',
    url(r'$', 'index', name='index'),
)