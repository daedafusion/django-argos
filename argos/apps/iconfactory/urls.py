from django.conf.urls import patterns, url

__author__ = 'mphilpot'

base64_pattern = r'(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'

urlpatterns = patterns('argos.apps.iconfactory.views',
    url(r'^(?P<icon_spec>.+)/$', 'get_icon', name='get_icon'),
)