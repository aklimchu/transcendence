FROM python:3.14.0a4-slim-bullseye

RUN pip3 install --upgrade pip && pip3 install django

COPY backend_source backend_source
WORKDIR /backend_source

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]