from django.http import HttpResponse
from django.shortcuts import render
from nicknames.models import Nickname
from django.utils import timezone
import json


def fetch(request, src):
    if int(src)==42:
        return HttpResponse(json.dumps({ "source" : "1"}), content_type="application/json") 
    nicks = Nickname.objects.filter(source=src)
    nicks = [{'source': n.source, 'target': n.target, 'alias': n.alias} for n in nicks] or []

    return HttpResponse(json.dumps(nicks), content_type="application/json")

def update(request, src, tgt, nick):
    nick = Nickname(source=src,target=tgt,alias=nick, pub_date=timezone.now())
    nick.save()
    return HttpResponse("created!")