#!/usr/bin/env bash

# Init Django
echo "from django.contrib.auth.models import User; if not User.objects.filter(username='admin@daedafusion.com').count(): User.objects.create_superuser('admin@daedafusion.com', 'admin@daedafusion.com', 'admin')" | python /opt/argos/django-argos/manage.py shell