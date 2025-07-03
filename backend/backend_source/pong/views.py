import logging
import json
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.exceptions import BadRequest
from django.utils.html import escape
from django.utils import timezone
from django.db import IntegrityError
from django.db.models import Q
from .models import *
from functools import wraps
from random import shuffle
from django_otp.plugins.otp_totp.models import TOTPDevice
import qrcode
import base64
from io import BytesIO

from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .serializers import GameSettingsSerializer

from rest_framework.permissions import IsAuthenticated, AllowAny

from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError

from django.core.files.storage import FileSystemStorage
import uuid
import json
import logging
from django.conf import settings

import os

from urllib.parse import urlencode, urlparse, parse_qs

logger = logging.getLogger(__name__)

def build_custom_totp_uri(device, user, issuer="ft_transcendence"):
    label = f"{issuer}:{user.username}"
    uri = device.config_url
    parsed = urlparse(uri)
    qs = parse_qs(parsed.query)
    qs["issuer"] = [issuer]
    new_query = urlencode(qs, doseq=True)
    return f"otpauth://totp/{label}?{new_query}"

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def TwoFAStatus(request):
    user = request.user
    TwoFA_enabled = user.totpdevice_set.filter(confirmed=True, name="default").exists()
    return Response({"2fa_enabled": TwoFA_enabled})

#[print(f"User: {f.name}\n") for f in User._meta.get_fields()]
#[print(f"PongSession: {f.name}\n") for f in PongSession._meta.get_fields()]


@api_view(['POST'])
@permission_classes([AllowAny])
def pong_register(request):
    username = request.data.get("username")
    password = request.data.get("password")
    if not username or not password:
        return Response({"error": "Missing username or password"}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)
    user = User.objects.create_user(username=username, password=password)
    device, _ = TOTPDevice.objects.get_or_create(user=user, name="default", defaults={"confirmed": True})
    custom_uri = build_custom_totp_uri(device, user)
    qr = qrcode.make(custom_uri)
    buf = BytesIO()
    qr.save(buf)
    qr_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return Response({
        "success": True,
        "qr_code": qr_b64,
        "secret": device.key
    }, status=201)

class TwoFAStatusView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        user = User.objects.filter(username=username).first()
        if not user:
            return Response({"2fa_enabled": False})
        twofa_enabled = TOTPDevice.objects.filter(user=user, confirmed=True, name="default").exists()
        return Response({"2fa_enabled": twofa_enabled})

class TwoFASetupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        device, _ = TOTPDevice.objects.get_or_create(user=user, name="default", defaults={"confirmed": False})
        custom_uri = build_custom_totp_uri(device, user)
        qr = qrcode.make(custom_uri)
        buf = BytesIO()
        qr.save(buf)
        qr_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        return Response({'qr_code': qr_b64, 'secret': device.key})

class TwoFAVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        token = request.data.get('token')
        try:
            device = TOTPDevice.objects.get(user=user, name="default")
        except TOTPDevice.DoesNotExist:
            return Response({'error': 'No 2FA device found.'}, status=400)
        if device.verify_token(token):
            device.confirmed = True
            device.save()
            return Response({'success': True})
        return Response({'error': 'Invalid code.'}, status=400)

class TwoFADisableView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            device = user.totpdevice_set.get(name="default")
            device.confirmed = False
            device.save()
            return Response({'success': True})
        except TOTPDevice.DoesNotExist:
            return Response({'error': 'No 2FA device to disable.'}, status=400)


def get_player_data(player_id):
    try:
        player = PongPlayer.objects.get(id=player_id)
        q_won = PongGame.objects.filter(Q(game_winner_1=player_id) | Q(game_winner_2=player_id))
        q_lost = PongGame.objects.filter(Q(game_loser_1=player_id) | Q(game_loser_2=player_id))
        return {
            "id": player_id,
            "name": player.player_name,
            "won": q_won.count(),
            "lost": q_lost.count()
        }
    except PongPlayer.DoesNotExist:
        return None

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
def player_match_history(request, player_id):
    """
    Retrieve 1v1 match history for a specific player.
    Returns game type, date, opponent, score, and outcome for each game.
    """
    try:
        # Get the user's session
        user = request.user
        if not hasattr(user, "pongsession"):
            return JsonResponse({
                "ok": False,
                "error": "No active session for user",
                "statusCode": 400
            }, status=400)

        session = user.pongsession

        # Verify the player belongs to the user's session
        player = PongPlayer.objects.filter(id=player_id, player_session=session).first()
        if not player:
            return JsonResponse({
                "ok": False,
                "error": "Player not found or not associated with your session",
                "statusCode": 403
            }, status=403)

        # Fetch 1v1 games where the player is either winner or loser
        games = PongGame.objects.filter(
            Q(game_session=session) &
            Q(game_winner_2__isnull=True, game_loser_2__isnull=True) &
            (Q(game_winner_1=player) | Q(game_loser_1=player))
        ).select_related('game_winner_1', 'game_loser_1').order_by('-id')[:10]

        # Format match history
        match_history = []
        for game in games:
            opponent = game.game_loser_1 if game.game_winner_1 == player else game.game_winner_1
            outcome = "win" if game.game_winner_1 == player else "loss"
            match_history.append({
                "game_type": game.game_type,
                "date": game.created_at.strftime("%d.%m.%Y"),  # Format as dd.mm.yyyy, e.g., 03.07.2025
                "opponent": opponent.player_name if opponent else "Unknown",
                "score": game.game_score or "N/A",
                "outcome": outcome
            })

        return JsonResponse({
            "ok": True,
            "message": "Match history retrieved successfully",
            "data": match_history,
            "statusCode": 200
        }, status=200)

    except PongPlayer.DoesNotExist:
        return JsonResponse({
            "ok": False,
            "error": "Player not found",
            "statusCode": 404
        }, status=404)
    except Exception as err:
        logger.error(f"Error in player_match_history for player_id {player_id}: {str(err)}")
        return JsonResponse({
            "ok": False,
            "error": str(err),
            "statusCode": 400
        }, status=400)

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
            "p1": get_player_data(session.active_player_1.id),
            "p2": get_player_data(session.active_player_2.id),
            "p3": get_player_data(session.active_player_3.id),
            "p4": get_player_data(session.active_player_4.id)
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
            "message": "Session data successfuly retrieved",
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
        user_names = [u.username for u in users]
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
                tournament_games = [tournament_object.tournament_game_1, tournament_object.tournament_game_2, tournament_object.tournament_game_3]
                if tournament_object.tournament_type != game_type:
                    return JsonResponse({"ok": False, "error": "Tournament and game types don't match", "statusCode": 400}, status=400)
                if tournament_index == 2 and None in tournament_games[:2]:
                    return JsonResponse({"ok": False, "error": "Can't push final before semifinals", "statusCode": 400}, status=400)
                if tournament_index == 0 and {winner_object, loser_object} != {tournament_object.semi_one_p1, tournament_object.semi_one_p2}:
                    return JsonResponse({"ok": False, "error": "Incorrect players for tournament game", "statusCode": 400}, status=400)
                if tournament_index == 1 and {winner_object, loser_object} != {tournament_object.semi_two_p1, tournament_object.semi_two_p2}:
                    return JsonResponse({"ok": False, "error": "Incorrect players for tournament game", "statusCode": 400}, status=400)
                if tournament_index == 2 and {winner_object, loser_object} != {tournament_object.tournament_game_1.game_winner_1, tournament_object.tournament_game_2.game_winner_1}:
                    return JsonResponse({"ok": False, "error": "Incorrect players for tournament game", "statusCode": 400}, status=400)
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

@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def pong_update_settings(request):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({"ok": False, "error": "Authentication required", "statusCode": 401}, status=401)
        if request.method == "GET":
            try:
                settings = GameSettings.objects.get(user=request.user)
            except GameSettings.DoesNotExist:
                logger.info(f"Creating default GameSettings for user {request.user.username}")
                settings = GameSettings.objects.create(user=request.user)
            session = None
            try:
                session = request.user.pongsession
            except (PongSession.DoesNotExist, AttributeError) as e:
                logger.warning(f"No PongSession for user {request.user.username}: {str(e)}")

            # Construct players array with avatar as URL
            players = []
            for position in range(1, 5):
                player_name = ""
                avatar_url = "/media/avatars/default-avatar.png"
                try:
                    player_field = getattr(session, f"active_player_{position}", None)
                    if player_field and hasattr(player_field, "player_name"):
                        player_name = player_field.player_name
                        if hasattr(player_field, "avatar") and player_field.avatar:
                            avatar_url = player_field.avatar.url  # Use .url directly, which includes MEDIA_URL
                    elif player_field:
                        logger.error(f"PongPlayer at position {position} has no player_name attribute")
                except Exception as e:
                    logger.error(f"Error accessing active_player_{position}: {str(e)}")
                players.append({"player_name": player_name, "position": position, "avatar": avatar_url})

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
            # Handle multipart/form-data
            form_data = request.POST
            files = request.FILES

            # Get user and related models
            user = request.user
            try:
                settings = GameSettings.objects.get(user=request.user)
            except GameSettings.DoesNotExist:
                logger.info(f"Creating default GameSettings for user {user.username}")
                settings = GameSettings.objects.create(user=user)
            try:
                session = user.pongsession
            except (PongSession.DoesNotExist, AttributeError) as e:
                logger.info(f"No PongSession for user {user.username}: {str(e)}")
                return JsonResponse({"ok": False, "error": "No active session found. Please start a session first.", "statusCode": 400}, status=400)
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
                if key in form_data and form_data[key] not in valid_values:
                    logger.warning(f"Invalid {key}: {form_data[key]} for user {user.username}")
                    return JsonResponse({"ok": False, "error": f"Invalid {key}: {form_data[key]}", "statusCode": 400}, status=400)

            # Update game settings
            settings.game_speed = form_data.get('game_speed', settings.game_speed)
            settings.ball_size = form_data.get('ball_size', settings.ball_size)
            settings.paddle_size = form_data.get('paddle_size', settings.paddle_size)
            settings.power_jump = form_data.get('power_jump', settings.power_jump)
            settings.theme = form_data.get('theme', settings.theme)
            settings.font_size = form_data.get('font_size', settings.font_size)
            settings.language = form_data.get('language', settings.language)
            settings.save()
            logger.info(f"Updated GameSettings for user {user.username}")

            # Update password if provided
            if form_data.get('password'):
                user.set_password(form_data['password'])
                user.save()
                logger.info(f"Updated password for user {user.username}")

            # Update player names and avatars
            player_fields = ['active_player_1', 'active_player_2', 'active_player_3', 'active_player_4']
            existing_names = []
            for field in player_fields:
                player = getattr(session, field, None)
                existing_names.append(player.player_name if player and hasattr(player, 'player_name') else None)

            # Validate new player data
            players_data = []
            for player_id in range(1, 5):
                player_name = form_data.get(f'players[{player_id - 1}][player_name]', '')
                position = form_data.get(f'players[{player_id - 1}][position]', player_id)
                avatar_file = files.get(f'players[{player_id - 1}][avatar]')

                if player_name or avatar_file:
                    players_data.append({'player_name': player_name, 'position': position})
                    if not (1 <= int(position) <= 4):
                        logger.warning(f"Invalid position {position} for player {player_name} by user {user.username}")
                        return JsonResponse({"ok": False, "error": f"Invalid position: {position}", "statusCode": 400}, status=400)

                    # Check for duplicate names
                    new_names = [p['player_name'] for p in players_data if p['player_name']]
                    if len(new_names) != len(set(new_names)):
                        logger.warning(f"Duplicate player names: {new_names} for user {user.username}")
                        return JsonResponse({"ok": False, "error": "New player names must be unique", "statusCode": 400}, status=400)

                    # Check against existing names (excluding self)
                    if player_name in [n for n in existing_names if n and existing_names.index(n) != player_id - 1]:
                        logger.warning(f"Player name '{player_name}' already used for user {user.username}")
                        return JsonResponse({"ok": False, "error": f"Player name '{player_name}' is already used by another player", "statusCode": 400}, status=400)

                    # Update player
                    player = getattr(session, player_fields[player_id - 1], None)
                    if player is None:
                        logger.warning(f"No player exists at position {position} for user {user.username}, skipping update for {player_name}")
                        continue

                    if player_name:
                        player.player_name = player_name
                        logger.info(f"Updated player name to {player_name} at position {position} for user {user.username}")

                    # Handle avatar upload
                    if avatar_file:
                        valid_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                        if avatar_file.content_type not in valid_types:
                            return JsonResponse({"ok": False, "error": f"Invalid file type for Player {position}. Use JPEG, PNG, GIF, or WebP.", "statusCode": 400}, status=400)
                        if avatar_file.size > 2 * 1024 * 1024:  # 2MB limit
                            return JsonResponse({"ok": False, "error": f"File size for Player {position} must be less than 2MB.", "statusCode": 400}, status=400)

                        # Generate unique filename with player position and timestamp
                        extension = avatar_file.name.split('.')[-1]
                        unique_filename = f"avatar_player{position}_{uuid.uuid4()}.{extension}"
                        fs = FileSystemStorage(location=os.path.join(settings.media_root, 'avatars'))  # Use os.path.join for path safety
                        try:
                            logger.info(f"Saving file to {os.path.join(settings.media_root, 'avatars', unique_filename)}")
                            filename = fs.save(unique_filename, avatar_file)  # Save file, returns relative path
                            player.avatar = os.path.join('avatars', filename)  # Store relative path
                            logger.info(f"Avatar saved at {player.avatar}")
                        except Exception as e:
                            logger.error(f"Avatar save failed: {str(e)}")
                            return JsonResponse({"ok": False, "error": f"Failed to save avatar for Player {position}: {str(e)}", "statusCode": 500}, status=500)

                    player.save()

            session.save()
            logger.info(f"Updated PongSession for user {user.username}")

            # Fetch updated players for response with avatar as URL
            players = []
            for position in range(1, 5):
                player = getattr(session, f"active_player_{position}", None)
                avatar_url = "/media/avatars/default-avatar.png"
                if player and hasattr(player, 'avatar') and player.avatar:
                    avatar_url = player.avatar.url  # Use .url directly, which includes MEDIA_URL
                players.append({
                    "player_name": player.player_name if player and hasattr(player, 'player_name') else "",
                    "position": position,
                    "avatar": avatar_url
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
            return JsonResponse({"ok": True, "message": "Settings updated successfully", "settings": settings_data, "statusCode": 200}, status=200)

        return JsonResponse({"ok": False, "error": "Method not allowed", "statusCode": 405}, status=405)
    except GameSettings.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Game settings not found for user", "statusCode": 400}, status=400)
    except PongSession.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Pong session not found for user", "statusCode": 400}, status=400)
    except Exception as err:
        logger.error(f"Unexpected error in pong_update_settings: {str(err)}")
        return JsonResponse({"ok": False, "error": str(err), "statusCode": 400}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_with_2fa(request):
    username = request.data.get("username")
    password = request.data.get("password")
    token = request.data.get("token")
    if not username or not password:
        return Response({"error": "Missing credentials"}, status=400)
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({"error": "Invalid credentials"}, status=401)
    device_qs = user.totpdevice_set.filter(confirmed=True, name="default")
    if device_qs.exists():
        if not token:
            return Response({"error": "2FA token required"}, status=401)
        device = device_qs.first()
        if not device.verify_token(token):
            return Response({"error": "Invalid 2FA token"}, status=401)
    refresh = RefreshToken.for_user(user)
    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user_id": user.id,
        "username": user.username,
    })
