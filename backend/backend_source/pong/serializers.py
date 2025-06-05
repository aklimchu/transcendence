from rest_framework import serializers
from .models import GameSettings, PongSession, PongPlayer

# serializers are a key component of Django REST Framework that handle the conversion of complex data types, 
# such as Django model instances or querysets, to and from native Python data types (e.g., dictionaries) 
# that can be easily rendered into JSON, XML, or other content types for API responses. They also handle 
# the reverse process, validating and deserializing incoming JSON data into model instances or other Python 
# objects for database operations.

class PongPlayerSerializer(serializers.Serializer):
    player_name = serializers.CharField(max_length=30, required=False, allow_blank=True)
    position = serializers.IntegerField(min_value=1, max_value=4, required=True)

class GameSettingsSerializer(serializers.ModelSerializer):
    players = PongPlayerSerializer(many=True, required=False)

    class Meta:
        model = GameSettings
        fields = ['game_speed', 'ball_size', 'paddle_size', 'theme', 'font_size', 'language', 'players']

    def validate_players(self, value):
        if not value:
            return value

        # Get existing player names from the user's PongSession
        user = self.context['request'].user
        try:
            session = user.pongsession
            existing_names = [
                session.active_player_1.player_name,
                session.active_player_2.player_name,
                session.active_player_3.player_name,
                session.active_player_4.player_name
            ]
        except PongSession.DoesNotExist:
            raise serializers.ValidationError("Pong session not found")

        # Collect new names and check for duplicates
        new_names = [(player['player_name'], player['position']) for player in value if player['player_name']]
        if not new_names:
            return value

        # Check for duplicates among new names
        names_only = [name for name, _ in new_names]
        if len(set(names_only)) != len(names_only):
            raise serializers.ValidationError("New player names must be unique")

        # Check each new name against existing names (excluding its own position)
        for name, position in new_names:
            other_existing_names = [existing_names[i] for i in range(4) if i + 1 != position]
            if name in other_existing_names or name in [n for n, pos in new_names if pos != position]:
                raise serializers.ValidationError(f"Player name '{name}' is already used by another player")

        return value

    def update(self, instance, validated_data):
        players_data = validated_data.pop('players', None)
        # Update GameSettings fields
        instance.game_speed = validated_data.get('game_speed', instance.game_speed)
        instance.ball_size = validated_data.get('ball_size', instance.ball_size)
        instance.paddle_size = validated_data.get('paddle_size', instance.paddle_size)
        instance.theme = validated_data.get('theme', instance.theme)
        instance.font_size = validated_data.get('font_size', instance.font_size)
        instance.language = validated_data.get('language', instance.language)
        instance.save()

        # Update player names only for provided data
        if players_data:
            session = instance.user.pongsession
            player_fields = [
                session.active_player_1,
                session.active_player_2,
                session.active_player_3,
                session.active_player_4
            ]
            for player_data in players_data:
                position = player_data.get('position')
                name = player_data.get('player_name')
                if position and name:
                    player_fields[position - 1].player_name = name
                    player_fields[position - 1].save()
