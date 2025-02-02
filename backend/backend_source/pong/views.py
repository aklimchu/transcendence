from django.shortcuts import render, HttpResponse
from .models import TestModel

# Create your views here.
def pong(request):
    return render(request, "pong.html")

def test_model(request):
    elements = TestModel.objects.all()
    return render(request, "test_model.html", {"Elements": elements})

def login(request):
    return render(request, "login.html")