from django.http import HttpResponse
from django.shortcuts import render
from nicknames.models import Nickname
from django.utils import timezone
import json


def fetch(request, src):
    nicks = Nickname.objects.filter(source=src)
    nicks = [{'source': n.source, 'target': n.target, 'alias': n.alias, 'name': n.name, 'username': n.username} for n in nicks] or []

    return HttpResponse(json.dumps(nicks), content_type="application/json")

def update(request, src, tgt, nick, usr, usrname):
    match_nicks = Nickname.objects.filter(source=src,target=tgt)
    if match_nicks:
        match_nicks = match_nicks[0]
        match_nicks.delete()
    nick = Nickname(source=src,target=tgt,alias=nick,name=usr,username=usrname)
    nick.save()
    return HttpResponse("created!")