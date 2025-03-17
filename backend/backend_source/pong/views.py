import json
from django.http import JsonResponse

from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout

from django.core.exceptions import BadRequest

from django.utils.html import escape
from django.utils import timezone

from django.db import IntegrityError
from django.db.models import Q
from .models import *

from functools import wraps
from random import shuffle

#[print(f"User: {f.name}\n") for f in User._meta.get_fields()]
#[print(f"PongSession: {f.name}\n") for f in PongSession._meta.get_fields()]


def pong_auth_wrapper(func):

    @wraps(func)
    def pong_auth_wrapper_sub(request):

        if request.user.is_authenticated:
            return func(request, request.user.username)
        else:
            return JsonResponse({"ok": False, "error": "Not authenticated", "statusCode": 401}, status=401)

    return pong_auth_wrapper_sub


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
            login(request, user)
            return JsonResponse({"ok": True, "message": f"Logged in: {user.username}", "statusCode": 200}, status=200)
        else:
            return JsonResponse({"ok": False, "error": "Invalid credentials", "statusCode": 401}, status=401)

    except Exception as err:
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)


@pong_auth_wrapper
def pong_logout(request, username):
    try:
        if request.method != "POST":
            return JsonResponse({"ok": False, "error": "Method not allowed", "statusCode": 405}, status=405)

        logout(request)
        return JsonResponse({"ok": True, "message": f"Logged out: {username}", "statusCode": 200}, status=200)
        
    except Exception as err:
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)



def get_player_data(player_id):

    name = PongPlayer.objects.get(id=player_id).player_name
    
    q_won = PongGame.objects.filter(Q(game_winner_1=player_id) | Q(game_winner_2=player_id))
    q_lost = PongGame.objects.filter(Q(game_loser_1=player_id) | Q(game_loser_2=player_id))

    return {"name": name, "won": q_won.count(), "lost": q_lost.count()}


def get_session_games(session_id):

    q_games = PongGame.objects.filter(Q(game_session=session_id)).order_by("-id")

    games_list = []

    for game in q_games:
        game_data = {
            "game_type": game.game_type,
            "score": game.game_score,
            "winner_1": game.game_winner_1.player_name if game.game_winner_1 is not None else None,
            "winner_2": game.game_winner_2.player_name if game.game_winner_2 is not None else None,
            "loser_1": game.game_loser_1.player_name if game.game_loser_1 is not None else None,
            "loser_2": game.game_loser_2.player_name if game.game_loser_2 is not None else None
        }

        games_list.append(game_data)
    
    return games_list


def get_session_tournaments(session_id):
        
        session_tournaments = PongTournament.objects.filter(Q(tournament_session=session_id)).order_by("-id")
        unfinished_tournament = None
        finished_tournaments = []

        for t in session_tournaments:
            t_data = {
                "tournament_type": t.tournament_type,
                "semi1_score": t.tournament_game_1.game_score if t.tournament_game_1 is not None else None,
                "semi1_winner": t.tournament_game_1.game_winner_1.player_name if t.tournament_game_1 is not None else None,
                "semi1_loser": t.tournament_game_1.game_loser_1.player_name if t.tournament_game_1 is not None else None,
                "semi2_score": t.tournament_game_2.game_score if t.tournament_game_2 is not None else None,
                "semi2_winner": t.tournament_game_2.game_winner_1.player_name if t.tournament_game_2 is not None else None,
                "semi2_loser": t.tournament_game_2.game_loser_1.player_name if t.tournament_game_2 is not None else None,
                "final_score": t.tournament_game_3.game_score if t.tournament_game_3 is not None else None,
                "final_winner": t.tournament_game_3.game_winner_1.player_name if t.tournament_game_3 is not None else None,
                "final_loser": t.tournament_game_3.game_loser_1.player_name if t.tournament_game_3 is not None else None
            }
            
            if t.tournament_game_3 is None:
                t_data["tournament_type"] = t.tournament_type
                t_data["semi_one_p1"] = t.semi_one_p1.player_name
                t_data["semi_one_p2"] = t.semi_one_p2.player_name
                t_data["semi_two_p1"] = t.semi_two_p1.player_name
                t_data["semi_two_p2"] = t.semi_two_p2.player_name
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
    
@pong_auth_wrapper
def pong_stats_data(request, username):

    print("Stats")
    try:
        if request.method != "GET":
            return JsonResponse({"ok": False, "error": "Method not allowed", "statusCode": 405}, status=405)

        users = User.objects.all()

        user_names = []
        for u in users:
            user_names.append(u.username)
            
        total_games = PongGame.objects.all().count()
    

        data = {
            "total_games": total_games,
            "user_names": user_names
        }

        return JsonResponse({"ok": True, "message": "Session data successfuly retrieved", "data": data, "statusCode": 200}, status=200)
    
    except Exception as err:
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)

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
        game_type = data.get("game_type")
        tournament = data.get("tournament")
        w1 = data.get("winner1")
        w2 = data.get("winner2")
        l1 = data.get("loser1")
        l2 = data.get("loser2")
        score = data.get("score")
        pong_game = None
        tournament_index = None

        if game_type not in ['pong', 'snek']:
            return JsonResponse({"ok": False, "error": "Incorrect game type", "statusCode": 400}, status=400)

        if ((w1 is None) != (w2 is None)) and ((l1 is None) != (l2 is None)) and score:

            winner = w1 if w1 is not None else w2
            loser = l1 if l1 is not None else l2

            if winner == loser:
                return JsonResponse({"ok": False, "error": "Can't push game with duplicate players", "statusCode": 400}, status=400)

            winner_object = PongPlayer.objects.get(Q(player_session=session.id) & Q(player_name=winner))
            loser_object = PongPlayer.objects.get(Q(player_session=session.id) & Q(player_name=loser))

            if tournament is not None:
                tournament_index = int(tournament) - 1
                if tournament_index not in [0, 1, 2]:
                    return JsonResponse({"ok": False, "error": "Incorrect tournament index", "statusCode": 400}, status=400)
                
                tournament_object = PongTournament.objects.get(Q(tournament_session=session.id) & Q(tournament_game_3=None))
                tournament_games = [tournament_object.tournament_game_1, tournament_object.tournament_game_2,tournament_object.tournament_game_3]

                # Check if tournament and game types match
                if tournament_object.tournament_type != game_type:
                    return JsonResponse({"ok": False, "error": "Tournament and game types don't match", "statusCode": 400}, status=400)

                # Check semifinals are completed before final
                if tournament_index == 2 and None in tournament_games[:2]:
                    return JsonResponse({"ok": False, "error": "Can't push final before semifinals", "statusCode": 400}, status=400)

                # Check if players from request match the expected ones
                if tournament_index == 0 and {winner_object, loser_object} != {tournament_object.semi_one_p1, tournament_object.semi_one_p2}:
                    return JsonResponse({"ok": False, "error": "Incorrect players for tournament game", "statusCode": 400}, status=400)
                if tournament_index == 1 and {winner_object, loser_object} != {tournament_object.semi_two_p1, tournament_object.semi_two_p2}:
                    return JsonResponse({"ok": False, "error": "Incorrect players for tournament game", "statusCode": 400}, status=400)
                if tournament_index == 2 and {winner_object, loser_object} != {tournament_object.tournament_game_1.game_winner_1, tournament_object.tournament_game_2.game_winner_1}:
                    return JsonResponse({"ok": False, "error": "Incorrect players for tournament game", "statusCode": 400}, status=400)
                
                # Check if game doesn't already exist
                if (tournament_games[tournament_index] is not None):
                    return JsonResponse({"ok": False, "error": "Can't overwrite tournament game", "statusCode": 400}, status=400)

            pong_game = PongGame.objects.create(
                game_type = game_type,
                game_score = score,
                game_session = session,
                game_winner_1 = winner_object,
                game_winner_2 = None,
                game_loser_1 = loser_object,
                game_loser_2 = None)

            if tournament is None:
                return JsonResponse({"ok": True, "message": "Pong 1v1 game - data successfuly pushed", "statusCode": 200}, status=200)
            
            else:
                if tournament_index == 0: tournament_object.tournament_game_1 = pong_game
                elif tournament_index == 1: tournament_object.tournament_game_2 = pong_game
                else: tournament_object.tournament_game_3 = pong_game
                tournament_object.save()

                return JsonResponse({"ok": True, "message": f"Successfuly pushed game {tournament_index + 1} of tournament", "statusCode": 200}, status=200)
        

        elif None not in (w1, w2, l1, l2) and score:

            if tournament is not None:
                return JsonResponse({"ok": False, "error": "Can't push a 2v2 game as part of a tournament", "statusCode": 400}, status=400)
            
            if len(set([w1, w2, l1, l2])) != 4:
                return JsonResponse({"ok": False, "error": "Can't push game with duplicate players", "statusCode": 400}, status=400)

            winner1_object = PongPlayer.objects.get(Q(player_session=session.id) & Q(player_name=w1))
            winner2_object = PongPlayer.objects.get(Q(player_session=session.id) & Q(player_name=w2))
            loser1_object = PongPlayer.objects.get(Q(player_session=session.id) & Q(player_name=l1))
            loser2_object = PongPlayer.objects.get(Q(player_session=session.id) & Q(player_name=l2))

            pong_game = PongGame.objects.create(
                game_score = score,
                game_session = session,
                game_winner_1 = winner1_object,
                game_winner_2 = winner2_object,
                game_loser_1 = loser1_object,
                game_loser_2 = loser2_object)

            return JsonResponse({"ok": True, "message": "Pong 2v2 game - data successfuly pushed", "statusCode": 200}, status=200)
        
        
        else:
            return JsonResponse({"ok": False, "error": "Incomplete game data", "statusCode": 400}, status=400)
    

    except Exception as err:
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)


@pong_auth_wrapper
def pong_create_tournament(request, username):
    try:
        if request.method != "POST":
            return JsonResponse({"ok": False, "error": "Method not allowed", "statusCode": 405}, status=405)

        if not request.body:
            raise BadRequest("Request without body")

        user = User.objects.get(username=username)
        session = user.pongsession
        
        data = json.loads(request.body)
        tournament_type = data.get("tournament_type")

        unfinished_tournaments = PongTournament.objects.filter(Q(tournament_session=session.id) & Q(tournament_game_3=None))

        if (unfinished_tournaments.count() > 0):
            return JsonResponse({"ok": False, "error": "Can't have more than one tournament ongoing", "statusCode": 400}, status=400)

        session_players_list = [session.active_player_1, session.active_player_2, session.active_player_3, session.active_player_4]

        shuffle(session_players_list)

        PongTournament.objects.create(
            tournament_session=session,
            tournament_type=tournament_type,
            semi_one_p1 = session_players_list[0],
            semi_one_p2 = session_players_list[1],
            semi_two_p1 = session_players_list[2],
            semi_two_p2 = session_players_list[3]
        )

        request.method = 'GET'
        return pong_session_data(request)

    except Exception as err:
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)
