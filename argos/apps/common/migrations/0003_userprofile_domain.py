# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0002_auto_20141007_1821'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='domain',
            field=models.CharField(max_length=255, null=True),
            preserve_default=True,
        ),
    ]
