from django.urls import path
from . import views

urlpatterns = [
    path("pong_login/", views.pong_login, name="pong_login"),
    path("pong_register/", views.pong_register, name="pong_register"),
    path("pong_auth/", views.pong_auth, name="pong_auth"),
    path("pong_player_data/", views.pong_player_data, name="pong_player_data")
]