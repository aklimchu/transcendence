from django.shortcuts import render, HttpResponse

# Create your views here.
def pong(request):
    return render(request, "pong.html")
