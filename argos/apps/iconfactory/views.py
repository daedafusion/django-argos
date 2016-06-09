import base64
import json
import logging
from django.core.cache import cache
from django.http import HttpResponse

from argos.libs.clients.iconfactory import IconFactoryClient
from django.views.decorators.cache import cache_control

log = logging.getLogger(__name__)

@cache_control(max_age=3600)
def get_icon(request, icon_spec):

    icon = cache.get(icon_spec)

    if not icon:

        client = IconFactoryClient(request.user.userprofile.token)

        icon_spec_obj = json.loads(base64.b64decode(icon_spec))

        log.info('cache miss for icon %s' % (icon_spec_obj['iconId'],))

        icon = client.get_svg_icon(request.user.userprofile.domain, icon_spec_obj['iconId'], 32, icon_spec_obj['mod'])

        cache.set(icon_spec, icon)

    return HttpResponse(icon, content_type="image/svg+xml")