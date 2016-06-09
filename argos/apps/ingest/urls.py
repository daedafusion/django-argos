from django.conf.urls import patterns, url

__author__ = 'mphilpot'


urlpatterns = patterns('argos.apps.ingest.views',
    url(r'^$', 'index', name='index'),
    url(r'^research/$', 'research', name='research'),

    url(r'^a/research/table/$', 'research_table', name='research_table'),
    url(r'^a/research/new/$', 'research_new', name='research_new'),
    url(r'^a/research/new/dialog/$', 'research_new_dialog', name='research_new_dialog'),
)