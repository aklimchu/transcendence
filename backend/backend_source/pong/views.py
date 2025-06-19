import logging
import json
from django.http import JsonResponse

from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from django.core.exceptions import BadRequest
from django.core.exceptions import ObjectDoesNotExist

from django.core.files.storage import default_storage

from django.utils.html import escape
from django.utils import timezone

from django.db import IntegrityError
from django.db.models import Q
from .models import *

from functools import wraps
from random import shuffle

from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import GameSettingsSerializer

from rest_framework.permissions import IsAuthenticated

from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError

#[print(f"User: {f.name}\n") for f in User._meta.get_fields()]
#[print(f"PongSession: {f.name}\n") for f in PongSession._meta.get_fields()]


@api_view(['POST'])
@permission_classes([AllowAny])
def pong_register(request):
    try:
        if not request.body:
            return JsonResponse({"ok": False, "error": "Request without body", "statusCode": 400}, status=400)

        data = json.loads(request.body)
        username = escape(data.get("username"))
        password = data.get("password")
        email = escape(data.get("email", ""))

        if not username or not password:
            return JsonResponse({"ok": False, "error": "Both username and password required", "statusCode": 400}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"ok": False, "error": "Username already exists", "statusCode": 400}, status=400)

        with transaction.atomic():
            # Create user
            user = User.objects.create_user(username=username, password=password, email=email)
            # Create or get PongSession
            session, created = PongSession.objects.get_or_create(user=user)
            if created or not session.active_player_1:
                # Create players
                session.active_player_1 = PongPlayer.objects.create(player_session=session, player_name="Player 1")
                session.active_player_2 = PongPlayer.objects.create(player_session=session, player_name="Player 2")
                session.active_player_3 = PongPlayer.objects.create(player_session=session, player_name="Player 3")
                session.active_player_4 = PongPlayer.objects.create(player_session=session, player_name="Player 4")
                session.save()
            # Create GameSettings
            GameSettings.objects.get_or_create(user=user)
            # Generate tokens
            refresh = RefreshToken.for_user(user)

        return JsonResponse({
            "ok": True,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {"id": user.id, "username": user.username},
            "message": "User created successfully",
            "statusCode": 201
        }, status=201)

    except IntegrityError as e:
        return JsonResponse({"ok": False, "error": f"Database error: {str(e)}", "statusCode": 400}, status=400)
    except Exception as e:
        return JsonResponse({"ok": False, "error": f"Registration failed: {str(e)}", "statusCode": 400}, status=400)





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



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pong_session_data(request):
    user = request.user

    if not hasattr(user, "pongsession"):
        return JsonResponse({
            "ok": False,
            "error": "No active session for user",
            "statusCode": 404
        }, status=404)

    session = user.pongsession

    try:
        active_players = {
            "p1": get_player_data(session.active_player_1.id) if session.active_player_1 else None,
            "p2": get_player_data(session.active_player_2.id) if session.active_player_2 else None,
            "p3": get_player_data(session.active_player_3.id) if session.active_player_3 else None,
            "p4": get_player_data(session.active_player_4.id) if session.active_player_4 else None,
        }

        unfinished_tournament, finished_tournaments = get_session_tournaments(session.id)

        data = {
            "players": active_players,
            "games": get_session_games(session.id),
            "unfinished_tournament": unfinished_tournament,
            "finished_tournaments": finished_tournaments
        }

        return JsonResponse({
            "ok": True,
            "message": "Session data successfully retrieved",
            "data": data,
            "statusCode": 200
        }, status=200)

    except Exception as err:
        return JsonResponse({
            "ok": False,
            "error": str(err),
            "statusCode": 400
        }, status=400)
	
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pong_stats_data(request):
	try:
		users = User.objects.all()

		user_names = []
		for u in users:
			user_names.append(u.username)
			
		total_games = PongGame.objects.all().count()
	

		data = {
			"total_games": total_games,
			"user_names": user_names
		}

		return Response({"ok": True, "message": "Session data successfuly retrieved", "data": data, "statusCode": 200}, status=200)
	
	except Exception as err:
		return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pong_push_game(request):
	try:
		if not request.body:
			raise BadRequest("Request without body")

		user = request.user
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


logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pong_create_tournament(request):
    try:
        if not request.body:
            raise ValidationError("Request without body")

        user = request.user
        session = user.pongsession

        data = json.loads(request.body.decode('utf-8'))
        tournament_type = data.get("tournament_type")

        if not tournament_type or tournament_type not in ["pong", "snek"]:
            raise ValidationError("Invalid or missing tournament_type")

        unfinished_tournaments = PongTournament.objects.filter(
            Q(tournament_session=session.id) & Q(tournament_game_3=None)
        )

        if unfinished_tournaments.count() > 0:
            return Response({
                "ok": False,
                "error": "Can't have more than one tournament ongoing",
                "statusCode": 400
            }, status=400)

        session_players_list = [
            session.active_player_1,
            session.active_player_2,
            session.active_player_3,
            session.active_player_4
        ]

        shuffle(session_players_list)

        tournament = PongTournament.objects.create(
            tournament_session=session,
            tournament_type=tournament_type,
            semi_one_p1=session_players_list[0],
            semi_one_p2=session_players_list[1],
            semi_two_p1=session_players_list[2],
            semi_two_p2=session_players_list[3]
        )

        # Construct response similar to pong_session_data
        active_players = {
            "p1": get_player_data(session.active_player_1.id) if session.active_player_1 else None,
            "p2": get_player_data(session.active_player_2.id) if session.active_player_2 else None,
            "p3": get_player_data(session.active_player_3.id) if session.active_player_3 else None,
            "p4": get_player_data(session.active_player_4.id) if session.active_player_4 else None,
        }

        unfinished_tournament, finished_tournaments = get_session_tournaments(session.id)

        response_data = {
            "ok": True,
            "message": "Tournament created and session data retrieved",
            "data": {
                "players": active_players,
                "games": get_session_games(session.id),
                "unfinished_tournament": unfinished_tournament,
                "finished_tournaments": finished_tournaments
            },
            "statusCode": 200
        }

        return Response(response_data)

    except ValidationError as ve:
        return Response({"ok": False, "error": str(ve), "statusCode": 400}, status=400)
    except Exception as err:
        logger.error(f"Error in pong_create_tournament: {str(err)}")
        return Response({"ok": False, "error": str(err), "statusCode": 400}, status=400)
    
# Configure logging
logger = logging.getLogger(__name__)

# New settings view
from django.core.files.storage import default_storage
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import PongPlayer, PongSession, GameSettings
from django.core.exceptions import ValidationError
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def pong_update_settings(request):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({"ok": False, "error": "Authentication required", "statusCode": 401}, status=401)

        if request.method == "GET":
            # Fetch GameSettings
            try:
                settings = GameSettings.objects.get(user=request.user)
            except GameSettings.DoesNotExist:
                logger.info(f"Creating default GameSettings for user {request.user.username}")
                settings = GameSettings.objects.create(user=request.user)

            # Fetch PongSession for players
            session = None
            try:
                session = request.user.pongsession
            except (ObjectDoesNotExist, AttributeError) as e:
                logger.warning(f"No PongSession for user {request.user.username}: {str(e)}")

            # Construct players array with avatars
            players = []
            for position in range(1, 5):
                player_name = ""
                avatar_url = None
                try:
                    player_field = getattr(session, f"active_player_{position}", None)
                    if player_field and hasattr(player_field, "player_name"):
                        player_name = player_field.player_name
                        avatar = getattr(player_field, 'avatar', None)
                        avatar_url = avatar.url if avatar else None
                    elif player_field:
                        logger.error(f"PongPlayer at position {position} has no player_name attribute")
                except Exception as e:
                    logger.error(f"Error accessing active_player_{position}: {str(e)}")
                players.append({
                    "player_name": player_name,
                    "avatar": avatar_url,
                    "position": position
                })

            # Prepare settings response
            settings_data = {
                "game_speed": settings.game_speed,
                "ball_size": settings.ball_size,
                "paddle_size": settings.paddle_size,
                "power_jump": settings.power_jump,
                "theme": settings.theme,
                "font_size": settings.font_size,
                "language": settings.language,
                "players": players
            }
            return JsonResponse({"ok": True, "settings": settings_data, "statusCode": 200}, status=200)

        elif request.method == "POST":
            user = request.user
            try:
                settings = user.gamesettings
            except GameSettings.DoesNotExist:
                logger.info(f"Creating default GameSettings for user {user.username}")
                settings = GameSettings.objects.create(user=user)

            try:
                session = user.pongsession
            except (ObjectDoesNotExist, AttributeError) as e:
                logger.info(f"No PongSession for user {user.username}: {str(e)}")
                return JsonResponse({"ok": False, "error": "No active session found. Please start a session first.", "statusCode": 400}, status=400)

            # Validate game settings
            valid_game_settings = {
                'game_speed': ['slow', 'normal', 'fast'],
                'ball_size': ['small', 'medium', 'large'],
                'paddle_size': ['short', 'normal', 'long'],
                'power_jump': ['on', 'off'],
                'theme': ['light', 'dark'],
                'font_size': ['small', 'medium', 'large'],
                'language': ['eng', 'fin', 'swd']
            }
            for key, valid_values in valid_game_settings.items():
                value = request.POST.get(key)
                if value and value not in valid_values:
                    logger.warning(f"Invalid {key}: {value} for user {user.username}")
                    return JsonResponse({"ok": False, "error": f"Invalid {key}: {value}", "statusCode": 400}, status=400)

            # Update game settings
            settings.game_speed = request.POST.get('game_speed', settings.game_speed)
            settings.ball_size = request.POST.get('ball_size', settings.ball_size)
            settings.paddle_size = request.POST.get('paddle_size', settings.paddle_size)
            settings.power_jump = request.POST.get('power_jump', settings.power_jump)
            settings.theme = request.POST.get('theme', settings.theme)
            settings.font_size = request.POST.get('font_size', settings.font_size)
            settings.language = request.POST.get('language', settings.language)
            settings.save()
            logger.info(f"Updated GameSettings for user {user.username}")

            # Update password if provided
            if request.POST.get('password'):
                user.set_password(request.POST['password'])
                user.save()
                logger.info(f"Updated password for user {user.username}")

            # Update player names and avatars
            player_fields = ['active_player_1', 'active_player_2', 'active_player_3', 'active_player_4']
            existing_names = []
            for field in player_fields:
                player = getattr(session, field, None)
                existing_names.append(player.player_name if player and hasattr(player, 'player_name') else None)

            # Validate new player data
            new_players = []
            for i in range(4):
                player_name = request.POST.get(f'players[{i}][player_name]')
                position = int(request.POST.get(f'players[{i}][position]', i + 1))
                avatar_file = request.FILES.get(f'players[{i}][avatar]')
                if player_name or avatar_file:
                    if not 1 <= position <= 4:
                        logger.warning(f"Invalid position {position} for player data by user {user.username}")
                        return JsonResponse({"ok": False, "error": f"Invalid position: {position}", "statusCode": 400}, status=400)
                    new_players.append((player_name, position, avatar_file))

            # Check for duplicates among new names
            names_only = [name for name, _, _ in new_players if name]
            if len(set(names_only)) != len(names_only):
                logger.warning(f"Duplicate player names: {names_only} for user {user.username}")
                return JsonResponse({"ok": False, "error": "New player names must be unique", "statusCode": 400}, status=400)

            # Check each new name against existing names (excluding its own position)
            for name, position, _ in new_players:
                if name:
                    other_existing_names = [existing_names[i] for i in range(4) if i + 1 != position and existing_names[i]]
                    if name in other_existing_names or name in [n for n, pos, _ in new_players if pos != position]:
                        logger.warning(f"Player name '{name}' already used for user {user.username}")
                        return JsonResponse({"ok": False, "error": f"Player name '{name}' is already used by another player", "statusCode": 400}, status=400)

            # Update player names and avatars
            for player_name, position, avatar_file in new_players:
                player = getattr(session, player_fields[position - 1], None)
                if player is None:
                    logger.warning(f"No player exists at position {position} for user {user.username}, skipping update for {player_name}")
                    continue
                try:
                    if player_name:
                        player.player_name = player_name
                    if avatar_file:
                        # Use a unique filename with timestamp to avoid conflicts
                        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
                        unique_filename = f"avatars/player_{user.username}_{position}_{timestamp}_{avatar_file.name}"
                        try:
                            file_path = default_storage.save(unique_filename, avatar_file)
                            player.avatar = file_path
                        except Exception as e:
                            logger.error(f"Failed to save avatar for position {position}: {str(e)}")
                            raise ValidationError(f"Failed to save avatar: {str(e)}")
                    player.save()
                    logger.info(f"Updated player name to {player_name} and avatar at position {position} for user {user.username}")
                except ValidationError as ve:
                    logger.error(f"Validation error updating player at position {position}: {str(ve)}")
                    return JsonResponse({"ok": False, "error": str(ve), "statusCode": 400}, status=400)
                except Exception as e:
                    logger.error(f"Error updating player at position {position}: {str(e)}")
                    return JsonResponse({"ok": False, "error": f"Error updating player at position {position}: {str(e)}", "statusCode": 400}, status=400)

            session.save()
            logger.info(f"Updated PongSession for user {user.username}")

            # Return updated settings to refresh the view
            players = []
            for position in range(1, 5):
                player_field = getattr(session, f"active_player_{position}", None)
                player_name = player_field.player_name if player_field and hasattr(player_field, "player_name") else ""
                avatar_url = getattr(player_field, 'avatar', None).url if player_field and getattr(player_field, 'avatar', None) else None
                players.append({
                    "player_name": player_name,
                    "avatar": avatar_url,
                    "position": position
                })

            settings_data = {
                "game_speed": settings.game_speed,
                "ball_size": settings.ball_size,
                "paddle_size": settings.paddle_size,
                "power_jump": settings.power_jump,
                "theme": settings.theme,
                "font_size": settings.font_size,
                "language": settings.language,
                "players": players
            }
            return JsonResponse({"ok": True, "settings": settings_data, "statusCode": 200}, status=200)

        return JsonResponse({"ok": False, "error": "Method not allowed", "statusCode": 405}, status=405)

    except GameSettings.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Game settings not found for user", "statusCode": 400}, status=400)
    except ObjectDoesNotExist:
        return JsonResponse({"ok": False, "error": "Pong session not found for user", "statusCode": 400}, status=400)
    except Exception as err:
        logger.error(f"Unexpected error in pong_update_settings: {str(err)}")
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 500}, status=500)