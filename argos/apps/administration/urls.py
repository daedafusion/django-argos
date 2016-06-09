from django.conf.urls import patterns, url

__author__ = 'mphilpot'

urlpatterns = patterns('argos.apps.administration.views',
    url(r'domain/$', 'domain', name='domain-admin'),
    url(r'site/$', 'site', name='site-admin'),
    url(r'partitions/$', 'partitions', name='partition-admin'),

    url(r'a/partitions/table/$', 'partitions_table', name='partition_table'),
    url(r'a/partitions/props/$', 'partitions_props', name='partition_props'),
    url(r'a/partitions/new/$', 'partitions_new', name='partition_new'),
    url(r'a/partitions/delete/$', 'partitions_delete', name='partition_delete'),
    url(r'a/partitions/update/$', 'partitions_update', name='partition_update'),
    url(r'a/partitions/perms/$', 'partitions_permissions_dialog', name='partition_perms'),

    url(r'a/partitions/list/$', 'partitions_list', name='partitions_list'),
)