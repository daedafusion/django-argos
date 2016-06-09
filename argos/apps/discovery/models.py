from django.contrib.auth.models import User
from django.db import models

# Create your models here.

class Workspace(models.Model):

    user = models.ForeignKey(User)

    # Meta
    created = models.DateTimeField()
    updated = models.DateTimeField()
    name = models.CharField(max_length=255, blank=True)

    config = models.TextField()
    nodes = models.TextField()