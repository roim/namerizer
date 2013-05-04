from django.http import HttpResponse
from django.shortcuts import render
from nicknames.models import Nickname
from django.utils import timezone
import json


def home(request):

    latest_messages = Nickname.objects.order_by('-pub_date')[:5]
    values = {'latest_messages': latest_messages}
    return render(request, 'namerizer/home.html', values)

def update(request):
    nick = Nickname.objects.filter(source=1).get()
    nick = {'id': nick.source}
    return HttpResponse(json.dumps(nick))