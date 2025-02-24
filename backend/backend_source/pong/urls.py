from django.urls import path
from . import views

urlpatterns = [
    path("pong_register/", views.pong_register, name="pong_register"),
    path("pong_login/", views.pong_login, name="pong_login"),
    path("pong_logout/", views.pong_logout, name="pong_logout"),
    path("pong_session_data/", views.pong_session_data, name="pong_session_data"),
    path("pong_stats_data/", views.pong_stats_data, name="pong_stats_data"),
    path("pong_push_game/", views.pong_push_game, name="pong_push_game"),
    path("pong_create_tournament/", views.pong_create_tournament, name="pong_create_tournament")
]
