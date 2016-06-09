from argos.libs.clients.ingest import ResearchClient
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import render

# Create your views here.

@login_required
def index(request):

    return render(request, 'ingest.html', {
        'title': 'Test',
    })


@login_required
def research(request):

    return render(request, 'research.html', {})


@login_required
def research_table(request):

    client = ResearchClient(request.user.userprofile.token)

    requests = client.get_research()

    rows = []

    for r in requests:
        rows.append([
            r['uuid'],
            r['researchType'],
            r['submitted'],
            r['status']
        ])

    return JsonResponse({"data": rows}, safe=False)


@login_required
def research_new(request):

    if request.method == "POST":
        client = ResearchClient(request.user.userprofile.token)

        research_type = request.POST.get('type', None)
        targets = request.POST.get('targets', '')

        if not type:
            return HttpResponseBadRequest()

        research_request = {
            'creator': request.user.username,
            'domain': request.user.userprofile.domain,
            'researchType': research_type,
            'researchTargets': targets.split('\n')
        }

        saved_request = client.save_request(research_request)

        return JsonResponse(saved_request, safe=False)

    return render(request, 'ajax/research_options.html', {
        'research_options': getattr(settings, 'RESEARCH_OPTIONS', [])
    })


@login_required
def research_new_dialog(request):

    return render(request, 'ajax/research_new_dialog.html', {})