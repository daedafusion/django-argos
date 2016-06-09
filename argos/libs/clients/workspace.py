import json
from argos.libs.discovery import Discovery
from django.conf import settings
import requests


class WorkspaceClient(object):

    def __init__(self, token, url=None):
        if url is None:
            discovery = Discovery()
            self.url = discovery.get_url("workspace")
        else:
            self.url = url

        self.token = token

        self.cert = getattr(settings, 'REQUESTS_CLIENT_CERT', None)
        self.verify = getattr(settings, 'REQUESTS_CLIENT_VERIFY', None)

    def get_workspace(self, uuid):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.get('%s/workspace/%s' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def new_workspace(self, workspace):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
            'content-type': 'application/json',
        }

        r = requests.post('%s/workspace' % self.url, data=json.dumps(workspace), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def update_workspace(self, workspace):
        headers = {
            'content-type': 'application/json',
            'authorization': self.token,
        }

        r = requests.put('%s/workspace/%s' % (self.url, workspace['uuid']), data=json.dumps(workspace), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

    def get_current_workspace(self, username):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.get('%s/workspace/current/%s' % (self.url, username), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def list_workspaces(self, username, offset=None, limit=None):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.get('%s/workspace/list/%s' % (self.url, username), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def save_snapshot(self, uuid, snapshot):
        headers = {
            'authorization': self.token,
            'content-type': 'application/json',
        }

        r = requests.post('%s/workspace/%s/snapshots' % (self.url, uuid), data=json.dumps(snapshot), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

    def workspace_undo(self, uuid):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.put('%s/workspace/%s/snapshots/undo' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def workspace_redo(self, uuid):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.put('%s/workspace/%s/snapshots/redo' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def list_checkpoints(self, uuid):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.get('%s/workspace/%s/checkpoints' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def load_checkpoint(self, workspace_uuid, checkpoint_uuid):
        headers = {
            'accept': 'application/json',
            'authorization': self.token,
        }

        r = requests.put('%s/workspace/%s/checkpoints/%s' % (self.url, workspace_uuid, checkpoint_uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

        return r.json()

    def new_checkpoint(self, workspace_uuid, checkpoint):
        headers = {
            'content-type': 'application/json',
            'authorization': self.token,
        }

        r = requests.post('%s/workspace/%s/checkpoints' % (self.url, workspace_uuid), data=json.dumps(checkpoint), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

    def delete_workspace(self, uuid):
        headers = {
            'authorization': self.token,
        }

        r = requests.delete('%s/workspace/%s' % (self.url, uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()

    def delete_checkpoint(self, workspace_uuid, checkpoint_uuid):
        headers = {
            'authorization': self.token,
        }

        r = requests.delete('%s/workspace/%s/checkpoints/%s' % (self.url, workspace_uuid, checkpoint_uuid), headers=headers, cert=self.cert, verify=self.verify)

        r.raise_for_status()