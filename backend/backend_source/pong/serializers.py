from rest_framework import serializers
from django.contrib.auth.models import User
from .models import GameSettings, PongSession, PongPlayer

class GameSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameSettings
        fields = ['game_speed', 'ball_size', 'paddle_size', 'theme', 'font_size', 'language']

class PongPlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PongPlayer
        fields = ['player_name']

class SettingsSerializer(serializers.Serializer):
    game_speed = serializers.CharField(max_length=10)
    ball_size = serializers.CharField(max_length=10)
    paddle_size = serializers.CharField(max_length=10)
    theme = serializers.CharField(max_length=10)
    font_size = serializers.CharField(max_length=10)
    language = serializers.CharField(max_length=10)
    password = serializers.CharField(max_length=128, required=False, allow_blank=True)
    players = PongPlayerSerializer(many=True)

    def validate_players(self, value):
        if len(value) != 4:
            raise serializers.ValidationError("Exactly 4 players must be provided.")
        names = [player['player_name'] for player in value if player['player_name']]
        if len(set(names)) != len(names):
            raise serializers.ValidationError("Player names must be unique within the session.")
        return value