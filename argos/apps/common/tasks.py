from argos.libs.clients.aniketos import AniketosClient
from celery.task import task
from django.contrib.auth.models import User

__author__ = 'mphilpot'

@task()
def validate_token(token_string, username):
    """This is used to reset the idle timer for the user session"""
    client = AniketosClient()

    if not client.is_token_valid(token_string):
        user = User.objects.get(username=username)
        user.userprofile.token = None
        user.userprofile.save()