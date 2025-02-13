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

from functools import wraps

#[print(f"User: {f.name}\n") for f in User._meta.get_fields()]
#[print(f"PongSession: {f.name}\n") for f in PongSession._meta.get_fields()]


def pong_auth_wrapper(func):

    @wraps(func)
    def pong_auth_wrapper_sub(request):

        signer = Signer(key = os.environ.get("SECRET_KEY"))

        for key, value in request.COOKIES.items():

            if key != "pong_session":
                continue
            try:
                value = signer.unsign_object(value)
            except:
                return JsonResponse({"ok": False, "error": "Bad session cookie", "statusCode": 400}, status=400)
            if value.get("is_authenticated") == True:
                return func(request, value.get("username"))

        return JsonResponse({"ok": False, "error": "Not authenticated", "statusCode": 400}, status=400)

    return pong_auth_wrapper_sub


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
            value = {"username": user.username, "is_authenticated": True}
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


@pong_auth_wrapper
def pong_auth(request, username):
    return JsonResponse({"ok": True, "message": f"User {username} authenticated", "statusCode": 200}, status=200)


from django.db.models import Q

def get_player_data(player_id):

    name = PongPlayer.objects.get(id=player_id).player_name
    crit1 = Q(game_winner_1=player_id)
    crit2 = Q(game_winner_2=player_id)
    crit3 = Q(game_loser_1=player_id)
    crit4 = Q(game_loser_2=player_id)
    
    q_won = PongGame.objects.filter(crit1 | crit2)
    q_lost = PongGame.objects.filter(crit3 | crit4)

    return {"name": name, "won": q_won.count(), "lost": q_lost.count()}


def get_session_games(session_id):

    crit1 = Q(game_session=session_id)
    q_games = PongGame.objects.filter(crit1)

    games_list = []

    for game in q_games:
        
        game_data = {
            "score": game.game_score,
            "winner_1": game.game_winner_1.player_name if game.game_winner_1 is not None else None,
            "winner_2": game.game_winner_2.player_name if game.game_winner_2 is not None else None,
            "loser_1": game.game_loser_1.player_name if game.game_loser_1 is not None else None,
            "loser_2": game.game_loser_2.player_name if game.game_loser_2 is not None else None
        }

        games_list.append(game_data)
    
    return games_list


@pong_auth_wrapper
def pong_session_data(request, username):
    try:
        if request.method != "GET":
            return JsonResponse({"ok": False, "error": "Method not allowed", "statusCode": 405}, status=405)

        user = User.objects.get(username=username)
        session = user.pongsession

        active_players = {
            "p1" : get_player_data(session.active_player_1.id),
            "p2" : get_player_data(session.active_player_2.id),
            "p3" : get_player_data(session.active_player_3.id),
            "p4" : get_player_data(session.active_player_4.id)
        }

        data = {
            "players" : active_players,
            "games" : get_session_games(session.id)
        }

        return JsonResponse({"ok": True, "message": "Session data successfuly retrieved", "data": data, "statusCode": 200}, status=200)
    
    except Exception as err:
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)