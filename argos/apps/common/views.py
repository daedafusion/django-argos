from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def index(request):

    return render(request, 'nav.html', {
        'title': 'Test',
    })


@login_required
def user_profile(request):

    return render(request, 'content/profile.html', {
        'title': 'Test',
    })

@login_required
def user_js(request):

    # TODO probably include base64(avatar)
    return render(request, 'user.js', {
        'user': {
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'domain': request.user.userprofile.domain,
        }
    }, content_type='text/javascript')