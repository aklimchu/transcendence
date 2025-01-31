FROM python:3.14.0a4-slim-bullseye

ENV PYTHONDONTWRITEBYTECODE 1 #Python writes no .pyc files to disc
ENV PYTHONUNBUFFERED 1 #Python does not buffer stdout and stderr

COPY backend_source backend_source
WORKDIR /backend_source

RUN pip3 install --upgrade pip && pip3 install -r requirements.txt

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]