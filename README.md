Usage:
```bash
git clone git@github.com:LucasOpoka/transcendence.git
```
Ensure you have docker installed
```bash
cd transcendence
docker compose up --build
```

Access the frontend at https://127.0.0.1:8042/

For now, access the backend at http://127.0.0.1:8000/

Move paddles with arrow up/down and W/S

Press enter to pause

To access postgrs database:
```
docker exec -it postgres_container  psql --username=pong_db_user --dbname=pong_db
```

Add data to Django's test_model through:
http://127.0.0.1:8000/admin

Check the added data here:
http://127.0.0.1:8000/test_model
