from django.urls import path
from . import views

urlpatterns = [
    path("pong_login/", views.pong_login, name="pong_login"),
    path("pong_register/", views.pong_register, name="pong_register")
]