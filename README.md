Usage:
```bash
git clone git@github.com:LucasOpoka/transcendence.git
```
Ensure you have docker installed
```bash
cd transcendence
docker compose up --build
```

Access the site at https://127.0.0.1:8042/

Move paddles with arrow up/down and W/S

Press enter to pause

To access postgrs database:
```
docker exec -it postgres_container  psql --username=pong_db_user --dbname=pong_db
```

Add data to Django's test_model through:
https://127.0.0.1:8042/admin

Check the added data here:
https://127.0.0.1:8042/test_model
