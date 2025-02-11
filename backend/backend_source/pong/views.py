import json
from django.http import JsonResponse

from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate

import os
from django.core.signing import Signer

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.core.exceptions import BadRequest

from django.utils.html import escape

from .models import *


@csrf_exempt
def pong_login(request):
    try:
        if request.method != "POST":
            return JsonResponse({"ok": False, "error": "Method not allowed", "statusCode": 405}, status=405)
        
        if not request.body:
            raise BadRequest("Request without body")
        
        data = json.loads(request.body)
        user = authenticate(request, username=data.get("username"), password=data.get("password"))

        if user is not None:
            response = JsonResponse({"ok": True, "message": "Logged in", "statusCode": 200}, status=200)
            key = f"pong_session"
            value = {"user": user.username, "is_authenticated": True}
            signer = Signer(key = os.environ.get("SECRET_KEY"))
            value = signer.sign_object(value)

            response.set_cookie(key, value, httponly=True, secure=True, max_age=3600)
            return response
        else:
            return JsonResponse({"ok": False, "error": "Invalid credentials", "statusCode": 401}, status=401)

    except Exception as err:
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)
    

@csrf_exempt
def pong_register(request):
    try:
        if request.method != "POST":
            return JsonResponse({"ok": False, "error": "Method not allowed", "statusCode": 405}, status=405)
        
        if not request.body:
            raise BadRequest("Request without body")
        
        data = json.loads(request.body)
        username = escape(data.get("username"))
        password = data.get("password")

        if not username or not password:
            return JsonResponse({"ok": False, "error": "Both username and password required", "statusCode": 400}, status=400)

        User.objects.create_user(username=username, password=password)

        return JsonResponse({"ok": True, "message": "Successfully registered", "statusCode": 200}, status=200)

    except IntegrityError:
        return JsonResponse({"ok": False, "error": "This username is already used", "statusCode": 400}, status=400)
    except Exception as err:
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)
    

def pong_auth(request):

    signer = Signer(key = os.environ.get("SECRET_KEY"))

    for key, value in request.COOKIES.items():

        if key != "pong_session":
            continue

        try:
            value = signer.unsign_object(value)
        except:
            return JsonResponse({"ok": False, "error": "Bad session cookie", "statusCode": 400}, status=400)
        
        if value.get('is_authenticated') == True:
            return JsonResponse({"ok": True, "message": f"User {value.get('user')} authenticated", "statusCode": 200}, status=200)

    return JsonResponse({"ok": False, "error": "Not authenticated", "statusCode": 400}, status=400)


def pong_player_data(request):

    signer = Signer(key = os.environ.get("SECRET_KEY"))

    for key, value in request.COOKIES.items():

        if key != "pong_session":
            continue
        try:
            value = signer.unsign_object(value)
        except:
            return JsonResponse({"ok": False, "error": "Bad session cookie", "statusCode": 400}, status=400)
        
        user = User.objects.get(username=value.get("user"))
        query_set = PongPlayer.objects.filter(player_session_id=user.pongsession.id)
        players_list = [q.player_name for q in query_set]
        return JsonResponse({"ok": True, "message": "Players successfuly retrieved", "data": players_list, "statusCode": 200}, status=200)