FROM python:3.13-slim-bullseye

ENV PYTHONDONTWRITEBYTECODE 1 #Python writes no .pyc files to disc
ENV PYTHONUNBUFFERED 1 #Python does not buffer stdout and stderr

RUN apt update && apt install netcat libpq-dev -y

COPY backend_source backend_source
WORKDIR /backend_source

RUN pip3 install --upgrade pip && pip3 install -r requirements.txt


COPY entrypoint.sh /bin/entrypoint.sh
RUN chmod +x /bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]