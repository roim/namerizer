from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'namerizer.views.home', name='home'),
    url(r'^update$', 'namerizer.views.update', name='upadte'),
    url(r'^fetch/', include('nicknames.urls')),
    url(r'^channel\.html$', 'namerizer.views.channel', name='channel')
    # url(r'^namerizer/', include('namerizer.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
