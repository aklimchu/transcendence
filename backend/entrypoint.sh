#!/bin/bash

echo "Waiting for postgres..."

while ! nc -z postgres_container 5432; do
    sleep 0.1
done

echo "PostgreSQL started"

# Manage migrations
python manage.py makemigrations
python manage.py migrate


python manage.py createsuperuser --noinput

exec "$@"
