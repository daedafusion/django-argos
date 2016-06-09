from django.conf import settings
from django.core.cache import cache
from django.core.management import BaseCommand, CommandError

__author__ = 'mphilpot'


class Command(BaseCommand):
    help= 'Clear your cache'

    def handle(self, *args, **options):
        try:
            assert settings.CACHES
            cache.clear()
            self.stdout.write("Your cache has been cleared\n")
        except AttributeError:
            raise CommandError("You have no cache configured!\n")