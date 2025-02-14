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

from django.db.models import Q
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

            response.set_cookie(key, value, httponly=True, secure=True, max_age=3600, samesite="Strict")
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


def get_player_data(player_id):

    name = PongPlayer.objects.get(id=player_id).player_name
    
    q_won = PongGame.objects.filter(Q(game_winner_1=player_id) | Q(game_winner_2=player_id))
    q_lost = PongGame.objects.filter(Q(game_loser_1=player_id) | Q(game_loser_2=player_id))

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


def get_session_tournaments(session_id):
        
        session_tournaments = PongTournament.objects.filter(Q(tournament_session=session_id))
        unfinished_tournaments_query =  session_tournaments.filter(Q(tournament_game_3=None))
        print(f"Unfinished tournametn: {unfinished_tournaments_query.count()}")

        unfinished_tournament = None
        finished_tournaments = []

        for t in session_tournaments:
            t_data = {
                "semi1_score" : t.tournament_game_1.game_score if t.tournament_game_1 is not None else None,
                "semi1_winner" : t.tournament_game_1.game_winner_1.player_name if t.tournament_game_1 is not None else None,
                "semi1_loser" : t.tournament_game_1.game_loser_1.player_name if t.tournament_game_1 is not None else None,
                "semi2_score" : t.tournament_game_2.game_score if t.tournament_game_2 is not None else None,
                "semi2_winner" : t.tournament_game_2.game_winner_1.player_name if t.tournament_game_2 is not None else None,
                "semi2_loser" : t.tournament_game_2.game_loser_1.player_name if t.tournament_game_2 is not None else None,
                "final_score" : t.tournament_game_3.game_score if t.tournament_game_3 is not None else None,
                "final_winner" : t.tournament_game_3.game_winner_1.player_name if t.tournament_game_3 is not None else None,
                "final_loser" : t.tournament_game_3.game_loser_1.player_name if t.tournament_game_3 is not None else None
            }
            
            if t.tournament_game_3 is None:
                unfinished_tournament = t_data
            else:
                finished_tournaments.append(t_data)

        return unfinished_tournament, finished_tournaments



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

        unfinished_tournament, finished_tournaments = get_session_tournaments(session.id)

        data = {
            "players": active_players,
            "games": get_session_games(session.id),
            "unfinished_tournament": unfinished_tournament,
            "finished_tournaments": finished_tournaments
        }

        return JsonResponse({"ok": True, "message": "Session data successfuly retrieved", "data": data, "statusCode": 200}, status=200)
    
    except Exception as err:
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)
    

@csrf_exempt
@pong_auth_wrapper
def pong_push_game(request, username):
    try:
        if request.method != "POST":
            return JsonResponse({"ok": False, "error": "Method not allowed", "statusCode": 405}, status=405)

        if not request.body:
            raise BadRequest("Request without body")
        
        user = User.objects.get(username=username)
        session = user.pongsession
        
        data = json.loads(request.body)
        w1 = data.get("winner1")
        w2 = data.get("winner2")
        l1 = data.get("loser1")
        l2 = data.get("loser2")
        score = data.get("score")

        if ((w1 is None) != (w2 is None)) and ((l1 is None) != (l2 is None)) and score:

            winner = w1 if w1 is not None else w2
            loser = l1 if l1 is not None else l2

            winner_object = PongPlayer.objects.get(Q(player_session=session.id) & Q(player_name=winner))
            loser_object = PongPlayer.objects.get(Q(player_session=session.id) & Q(player_name=loser))

            PongGame.objects.create(
                game_score = score,
                game_session = session,
                game_winner_1 = winner_object,
                game_winner_2 = None,
                game_loser_1 = loser_object,
                game_loser_2 = None)

            return JsonResponse({"ok": True, "message": "Pong 1v1 game - data successfuly pushed", "statusCode": 200}, status=200)
        
        elif None not in (w1, w2, l1, l2) and score:
            return JsonResponse({"ok": True, "message": "2v2", "statusCode": 200}, status=200)
        
        else:
            return JsonResponse({"ok": False, "error": "Incomplete game data", "statusCode": 400}, status=400)
    
    except Exception as err:
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)