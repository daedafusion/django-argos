from django.conf.urls import patterns, url

__author__ = 'mphilpot'

urlpatterns = patterns('argos.apps.common.views',
    url(r'^$', 'user_profile', name='user-profile'),
    url(r'^user.js$', 'user_js', name='user-js'),
)