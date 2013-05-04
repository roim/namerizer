from django.conf.urls import patterns, url

from nicknames import views

urlpatterns = patterns('nicknames.views',
    url(r'^(?P<src>\d+)/$', views.fetch, name='fetch'),
    url(r'^create/(?P<src>\d+)/(?P<tgt>\d+)/(?P<nick>\w+)', views.update, name='update')
)