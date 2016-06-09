django-argos
============


Install
=======

OSX
---

    brew install node libevent libmemcached
    npm install -g bower


Linux
-----

    apt-get install python-dev libevent-dev nodejs
    update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10

Deploy
======
    
    ./manage.py migrate
    ./manage.py createsuperuser # should only have to run this once
    ./manage.py bower_install
    ./manage.py collectstatic -l
    
    ./manage.py runserver

    ./manage.py celery worker #TODO this should be daemonized
    
    ./server.py # Run swapdragon websocket's server