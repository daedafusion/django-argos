from django.contrib.auth import user_logged_out
from django.contrib.auth.models import User
from django.db import models
from django.conf import settings

# Create your models here.
from django.db.models.signals import post_save
from django.dispatch import receiver
from argos.libs.clients.aniketos import AniketosClient


class UserProfile(models.Model):

    user = models.OneToOneField(User)
    language = models.CharField(max_length=5, default="en-us")
    token = models.CharField(max_length=255, null=True)
    domain = models.CharField(max_length=255, null=True)

    def __unicode__(self):
        return self.user.username


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        try:
            profile, result = UserProfile.objects.get_or_create(user=instance)
        except:
            pass

@receiver(user_logged_out, sender=User)
def logoff_user(sender, request, user, **kwargs):
    if 'argos.apps.common.auth.AniketosAuthentication' in getattr(settings, 'AUTHENTICATION_BACKENDS'):
        profile = UserProfile.objects.get(user=user)
        client = AniketosClient()

        client.logout(profile.token)

        profile.token = None
        profile.save()