import json
from argos.apps.common.models import UserProfile
from argos.libs.clients.workspace import WorkspaceClient
from django.core.cache import cache
from swampdragon import route_handler
from swampdragon.permissions import login_required
from swampdragon.route_handler import BaseRouter



class WorkspaceRouter(BaseRouter):
    route_name = 'workspace-router'
    valid_verbs = ['list_workspaces', 'load_workspace', 'new_workspace', 'delete_workspace',
                   'update', 'save', 'undo', 'redo',
                   'list_checkpoints', 'new_checkpoint', 'load_checkpoint', 'delete_checkpoint']

    @login_required
    def delete_workspace(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            if 'uuid' not in kwargs:
                self.send_error({'message': 'missing workspace uuid'})
                return

            client.delete_workspace(kwargs['uuid'])

            self.send({'message': 'success'}) #TODO come up with some convention
        except Exception, e:
            print(e)
            self.send_error({'message': 'error deleting workspace'})

    @login_required
    def new_workspace(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            workspace = {
                'username': user.username,
            }

            workspace = client.new_workspace(workspace)

            cache.set('%s:workspace' % user.username, workspace)

            self.send(workspace)
        except Exception, e:
            print(e)
            self.send_error({'message': 'error creating new workspace'})

    @login_required
    def update(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            if 'workspace' not in kwargs:
                self.send_error({'message': 'missing workspace'})
                return

            client.update_workspace(kwargs['workspace'])

            cache.set('%s:workspace' % user.username, kwargs['workspace'])

            self.send({'message': 'success'}) #TODO come up with some convention
        except Exception, e:
            print(e)
            self.send_error({'message': 'error updating workspace'})

    @login_required
    def list_workspaces(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)
            workspaces = client.list_workspaces(user.username)  # TODO offset & limit

            for w in workspaces:
                w['graph'] = None
        except Exception, e:
            workspaces = []  # TODO add logging

        self.send(workspaces)

    @login_required
    def undo(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            if 'uuid' not in kwargs:
                self.send_error({'message': 'missing workspace uuid'})
                return

            snapshot = client.workspace_undo(kwargs['uuid'])

            self.send(snapshot)

        except Exception, e:
            print(e)
            self.send_error({'message': 'undo workspace error'})

    @login_required
    def redo(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            if 'uuid' not in kwargs:
                self.send_error({'message': 'missing workspace uuid'})
                return

            snapshot = client.workspace_redo(kwargs['uuid'])

            self.send(snapshot)

        except Exception, e:
            print(e)
            self.send_error({'message': 'redo workspace error'})

    @login_required
    def load_workspace(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            if 'uuid' in kwargs:
                workspace = client.get_workspace(kwargs['uuid'])
            else:
                workspace = client.get_current_workspace(user.username)

            cache.set('%s:workspace' % user.username, workspace)

            self.send(workspace)
        except Exception, e:
            print(e)
            self.send_error({'message': 'error loading current workspace'})

    @login_required
    def save(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            if 'uuid' not in kwargs or 'graph' not in kwargs:
                self.send_error({'message': 'missing workspace uuid or graph'})
                return

            snapshot = {
                'graph': json.dumps(kwargs['graph'])
            }
            client.save_snapshot(kwargs['uuid'], snapshot)
        except Exception, e:
            print(e)
            self.send({'message': 'error saving workspace snapshot'})

    @login_required
    def list_checkpoints(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            if 'uuid' not in kwargs:
                self.send_error({'message': 'missing workspace uuid'});
                return

            checkpoints = client.list_checkpoints(kwargs['uuid'])

            for c in checkpoints:
                c['graph'] = None

            self.send(checkpoints)
        except Exception, e:
            print(e)
            self.send({'message': 'error listing workspace snapshots'})

    @login_required
    def new_checkpoint(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            if 'uuid' not in kwargs or 'checkpoint' not in kwargs:
                self.send_error({'message': 'missing workspace uuid'})
                return

            checkpoint = {
                'name': kwargs['checkpoint']['name'],
                'graph': {
                    'graph': json.dumps(kwargs['checkpoint']['graph'])
                }
            }

            client.new_checkpoint(kwargs['uuid'], checkpoint)
            self.send({'message': 'success'}) #TODO come up with some convention
        except Exception, e:
            print(e)
            self.send({'message': 'error listing workspace snapshots'})

    @login_required
    def load_checkpoint(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            if 'uuid' not in kwargs or 'checkpoint' not in kwargs:
                self.send_error({'message': 'missing workspace uuid'})
                return

            snapshot = client.load_checkpoint(kwargs['uuid'], kwargs['checkpoint'])

            self.send(snapshot)
        except Exception, e:
            print(e)
            self.send({'message': 'error listing workspace snapshots'})

    @login_required
    def delete_checkpoint(self, **kwargs):
        user = self.connection.user
        token = UserProfile.objects.get(user=user).token

        try:
            client = WorkspaceClient(token)

            if 'uuid' not in kwargs or 'checkpoint' not in kwargs:
                self.send_error({'message': 'missing workspace uuid'})
                return

            client.delete_checkpoint(kwargs['uuid'], kwargs['checkpoint'])

            self.send({'message': 'success'}) #TODO come up with some convention
        except Exception, e:
            print(e)
            self.send_error({'message': 'error deleting workspace'})

route_handler.register(WorkspaceRouter)