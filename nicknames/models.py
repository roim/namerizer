from django.db import models

# Create your models here.
class Nickname(models.Model):
    source = models.BigIntegerField()
    target = models.BigIntegerField()
    alias = models.CharField(max_length=200)
    name = models.CharField(max_length=200)
    username = models.CharField(max_length=200)
