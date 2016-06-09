from argos.apps.common.models import UserProfile
from argos.libs.clients.aniketos import AniketosClient
from argos.libs.clients.chat import ChatClient
from requests import HTTPError
from swampdragon import route_handler
from swampdragon.permissions import login_required
from swampdragon.route_handler import BaseRouter

__author__ = 'mphilpot'


class SessionRouter(BaseRouter):
    route_name = 'session-router'
    valid_verbs = ['is_session_valid']

    @login_required
    def is_session_valid(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = AniketosClient()

            response = client.token_validation(token, False)

            if response['valid']:
                self.send({'valid': True})
            else:
                user.userprofile.token = None
                user.userprofile.save()
                self.send({'valid': False})
        except Exception, e:
            self.send({'valid': False})


class ChatRouter(BaseRouter):
    route_name = 'chat-router'
    valid_verbs = ['subscribe', 'unsubscribe', 'does_room_exist', 'create_room', 'send_message', 'get_conversation']

    def get_subscription_channels(self, **kwargs):
        return ['chat:%s' % kwargs['uuid']]

    @login_required
    def subscribe(self, **kwargs):
        super(ChatRouter, self).subscribe(**kwargs)

    @login_required
    def does_room_exist(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        if 'type' not in kwargs or 'target' not in kwargs:
            self.send_error({'message': 'Missing type or target for chat room'})
            return

        try:
            client = ChatClient(token)

            room = client.get_room(kwargs['target'], kwargs['type'])

            self.send({'exists': True, 'uuid': room['uuid']})

        except HTTPError, e:
            if e.response.status_code == 404:
                self.send({'exists': False})
            else:
                self.send_error({'message': 'Client error'})
        except Exception:
            self.send_error({'message': 'Error'})

    @login_required
    def create_room(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        if 'type' not in kwargs or 'target' not in kwargs:
            self.send_error({'message': 'Missing type or target for chat room'})
            return

        try:
            client = ChatClient(token)

            room = {
                'targetUri': kwargs['target'],
                'targetType': kwargs['type'],
                'name': '%s/%s' % (kwargs['type'], kwargs['target']),
                'permissions': [
                    self.connection.user.username
                ]
            }

            room = client.create_room(room)

            self.send(room)

        except Exception, e:
            self.send_error({'message': 'Error creating room'})

    @login_required
    def send_message(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        if 'message' not in kwargs or 'uuid' not in kwargs:
            self.send_error({'message': 'Missing message'})
            return

        # TODO links

        try:
            client = ChatClient(token)

            message = {
                'message': kwargs['message'],
                'username': user.username
            }

            message = client.compose(kwargs['uuid'], message)

            self.send(message)

        except Exception, e:
            self.send_error({'message': 'Error composing message'})

    @login_required
    def get_conversation(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        if 'uuid' not in kwargs:
            self.send_error({'message': 'Missing room uuid'})
            return

        try:
            client = ChatClient(token)

            conv = client.get_conversation(kwargs['uuid'])

            conv['messages'].reverse()

            self.send(conv)

        except Exception, e:
            self.send_error({'message': 'Error retrieving conversation'})

route_handler.register(SessionRouter)
route_handler.register(ChatRouter)