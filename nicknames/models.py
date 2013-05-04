from django.db import models

# Create your models here.
class Nickname(models.Model):
    source = models.IntegerField()
    target = models.IntegerField()
    alias = models.CharField(max_length=200)
    pub_date = models.DateTimeField('date published')
