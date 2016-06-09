from django.contrib import admin

# Register your models here.
from argos.apps.common.models import UserProfile

admin.site.register(UserProfile)