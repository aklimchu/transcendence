from django.urls import path
from . import views

urlpatterns = [
    path("", views.pong, name="pong"),
    path("test_model/", views.test_model, name="test_model")
]