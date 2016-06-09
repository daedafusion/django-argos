from argos.apps.common.models import UserProfile
from argos.libs.clients.notification import NotificationClient
from swampdragon import route_handler
from swampdragon.permissions import login_required
from swampdragon.route_handler import BaseRouter

import logging
log = logging.getLogger(__name__)


class UnreadNotificationsRouter(BaseRouter):
    route_name = 'notification-unread-route'
    valid_verbs = ['subscribe', 'get_unread']

    def get_subscription_channels(self, **kwargs):
        return ['notif-%s-unread' % self.connection.user]

    @login_required
    def subscribe(self, **kwargs):
        super(UnreadNotificationsRouter, self).subscribe(**kwargs)

    @login_required
    def get_unread(self, **kwargs):
        username = self.connection.user

        token = UserProfile.objects.get(user=username).token

        try:
            client = NotificationClient(token)
            unread = client.get_num_unread(username)
        except Exception, e:
            log.exception('error getting unread notifications', e)
            unread = 0

        self.send({'unread': unread})


class NotificationsRouter(BaseRouter):
    route_name = 'notification-route'
    valid_verbs = ['subscribe', 'get_notifications', 'read_notification']

    def get_subscription_channels(self, **kwargs):
        return ['notif-%s' % self.connection.user]  # TODO also subscribe to domain and global channels?

    @login_required
    def subscribe(self, **kwargs):
        super(NotificationsRouter, self).subscribe(**kwargs)

    @login_required
    def read_notification(self, **kwargs):
        user = self.connection.user

        token = UserProfile.objects.get(user=user).token

        if 'uuid' not in kwargs:
            log.error('missing notification uuid')
            self.send_error('missing notification uuid')
            return

        try:
            client = NotificationClient(token)
            client.mark_read(kwargs['uuid'])
            self.send({'message': 'success'})
        except Exception, e:
            print(e)
            self.send_error('missing notification uuid')
            log.exception('error reading notification', e)

    @login_required
    def get_notifications(self, **kwargs):
        user = self.connection.user

        token = UserProfile.objects.get(user=user).token

        try:
            client = NotificationClient(token)
            notifications = client.get_list(user.username, kwargs.get('offset', 0), kwargs.get('limit', 10))
        except Exception, e:
            print(e)
            log.exception('error getting notifications', e)
            notifications = []

        self.send(notifications)


route_handler.register(UnreadNotificationsRouter)
route_handler.register(NotificationsRouter)