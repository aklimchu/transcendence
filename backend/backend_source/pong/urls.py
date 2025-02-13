from django.urls import path
from . import views

urlpatterns = [
    path("pong_login/", views.pong_login, name="pong_login"),
    path("pong_register/", views.pong_register, name="pong_register"),
    path("pong_auth/", views.pong_auth, name="pong_auth"),
    path("pong_session_data/", views.pong_session_data, name="pong_session_data"),
    path("pong_push_game/", views.pong_push_game, name="pong_push_game")
]