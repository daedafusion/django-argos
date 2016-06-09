from django.conf.urls import patterns, url

__author__ = 'mphilpot'


urlpatterns = patterns('argos.apps.discovery.views',
    url(r'^$', 'index', name='index'),

    url(r'^a/ontology/$', 'ontology_description', name='ontology_description'),
    url(r'^a/search/$', 'knowledge_search', name="knowledge_search"),
    url(r'^a/search/sparql/$', 'sparql_query', name='sparql_query'),
    url(r'^a/search/litprefix/$', 'literal_prefix_lookup', name='literal_prefix_lookup'),
    url(r'^a/describe/referenced/$', 'describe_referenced', name='describe_referenced'),
    url(r'^a/describe/follow/$', 'follow_reference', name='follow_reference'),
    url(r'^a/contextmenu/$', 'node_contextmenu', name='node_contextmenu'),
    url(r'^a/editor/get/$', 'editor_get', name='editor_get'),
    url(r'^a/editor/save/$', 'editor_save', name='editor_save'),
    url(r'^a/editor/delete/$', 'editor_delete', name='editor_delete'),
)