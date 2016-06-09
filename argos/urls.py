from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect
from django.views.decorators.cache import cache_page

from django_js_reverse.views import urls_js

admin.site.login = login_required(admin.site.login)

urlpatterns = patterns('',

    url(r'^favicon\.ico$', lambda x: HttpResponseRedirect('/static/img/favicon.ico')),
    url(r'^jsr/$', cache_page(3600)(urls_js), name='js_reverse'),

    url(r'^$', 'argos.apps.common.views.index', name='index'),
    #url(r'^login/$', 'django.contrib.auth.views.login', {'template_name': 'content/login.html'}, name='login'),
    url(r'', include('two_factor.urls', 'two_factor')),
    url(r'', include('user_sessions.urls', 'user_sessions')),
    url(r'^logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}, name='logout'),

    url(r'^discovery/', include('argos.apps.discovery.urls', namespace="discovery", app_name="discovery")),
    url(r'^assets/', include('argos.apps.assets.urls', namespace="assets", app_name="assets")),
    url(r'^analytics/', include('argos.apps.analytics.urls', namespace="analytics", app_name="analytics")),
    url(r'^ingest/', include('argos.apps.ingest.urls', namespace="ingest", app_name="ingest")),
    url(r'^cases/', include('argos.apps.cases.urls', namespace="cases", app_name="cases")),
    url(r'^reports/', include('argos.apps.reports.urls', namespace="reports", app_name="reports")),
    url(r'^notifications/', include('argos.apps.notifications.urls', namespace="notifications", app_name="notifications")),

    url(r'^icons/', include('argos.apps.iconfactory.urls', namespace="iconfactory", app_name="iconfactory")),

    url(r'^profile/', include('argos.apps.common.urls', namespace="common", app_name="common")),
    url(r'^administration/', include('argos.apps.administration.urls', namespace="administration", app_name="administration")),

    url(r'^reset/', include('password_reset.urls')),

    url(r'^admin/', include(admin.site.urls)),
)
