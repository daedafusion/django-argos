import logging
from argos.apps.common.tasks import validate_token
from django.conf import settings
from django.contrib import auth
from django.contrib.auth.models import User
import jwt
from requests import HTTPError
from argos.apps.common.models import UserProfile
from argos.libs.clients.aniketos import AniketosClient

__author__ = 'mphilpot'

log = logging.getLogger('argos.security')

class AniketosTokenValidationMiddleware(object):

    def process_request(self, request):
        if request.user.is_authenticated():
            token = request.user.userprofile.token

            shared_secret = getattr(settings, 'JWT_SHARED_SECRET', 'sharedSecret')

            if not token:
                auth.logout(request)
                return

            try:
                decoded_token = jwt.decode(token, shared_secret)

                # Async task to refresh idle counter
                validate_token.apply_async(args=[token, request.user.username])

            except (jwt.ExpiredSignature, ValueError) as e:
                log.info(e)
                request.user.userprofile.token = None
                request.user.userprofile.save()
                auth.logout(request)


class AniketosAuthentication(object):

    def authenticate(self, username=None, password=None):

        client = AniketosClient()

        try:

            user = User.objects.get(username=username)

            profile = UserProfile.objects.get(user=user)

            if profile.token is not None and client.is_token_valid(profile.token):
                if getattr(settings, 'DEBUG', False):
                    log.info("token = %s", profile.token)

                return user

            try:
                response = client.authenticate(username=username, password=password)

                profile.token = response['token']
                profile.domain = response['domain']
                profile.save()

                if getattr(settings, 'DEBUG', False):
                    log.info("token = %s", profile.token)

                return user

            except HTTPError as e:
                return None

        except User.DoesNotExist as e:

            try:
                response = client.authenticate(username=username, password=password)

                token = response['token']
                domain = response['domain']

                identity = client.identity(token)

                user = User.objects.create_user(username, None, None)
                user.set_unusable_password()

                # TODO get other attributes from identity

                user.save()

                profile = UserProfile.objects.get(user=user)
                profile.token = token
                profile.domain = domain
                profile.save()

                if getattr(settings, 'DEBUG', False):
                    log.info("token = %s", profile.token)

                return user

            except HTTPError as e:
                return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

    def has_perm(self, user_obj, perm, obj=None):
        """


        :param user_obj:
        :param perm: "ACTION|URI" e.g. "POST|identity:password"
        :param obj: Dictionary of additional context
        :return:
        """
        if not user_obj.is_active:
            return False

        client = AniketosClient()

        elements = perm.split('|')

        if len(elements) != 2:
            raise ValueError("Invalid perm string %s" % perm)

        username = user_obj.username
        action = elements[0]
        uri = elements[1]

        # TODO context
        return client.is_authorized(user_obj.userprofile.token, username, action, uri)

