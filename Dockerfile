FROM ubuntu:14.04

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y && \
    DEBIAN_FRONTEND=noninteractive apt-get -y install npm python-pip libevent-dev python-dev libmemcached-dev supervisor && \
    rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10

ENV HOME /root

RUN npm install -g bower

ADD reqs /root/reqs
RUN pip install -r /root/reqs/common.txt

RUN mkdir -p /opt/argos/django-argos
ADD argos /opt/argos/django-argos/argos
ADD gunicorn.py /opt/argos/django-argos/gunicorn.py
ADD manage.py /opt/argos/django-argos/manage.py
ADD server.py /opt/argos/django-argos/server.py

WORKDIR /opt/argos/django-argos

RUN ./manage.py migrate
#RUN echo "from django.contrib.auth.models import User; if not User.objects.filter(username='admin@daedafusion.com').count(): User.objects.create_superuser('admin@daedafusion.com', 'admin@daedafusion.com', 'admin')" | python /opt/argos/django-argos/manage.py shell
RUN ./manage.py bower_install -- --allow-root
RUN ./manage.py collectstatic -l --noinput

VOLUME ["/var/log/argos", "/etc/argos"]

EXPOSE 8000 9999

COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
CMD ["/usr/bin/supervisord"]