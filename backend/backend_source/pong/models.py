from django.db import models, transaction
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings  # For media-related defaults

# Create your models here.

class PongSession(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    active_player_1 = models.ForeignKey("PongPlayer", null=True, blank=True, on_delete=models.SET_NULL, related_name="active_player_1")
    active_player_2 = models.ForeignKey("PongPlayer", null=True, blank=True, on_delete=models.SET_NULL, related_name="active_player_2")
    active_player_3 = models.ForeignKey("PongPlayer", null=True, blank=True, on_delete=models.SET_NULL, related_name="active_player_3")
    active_player_4 = models.ForeignKey("PongPlayer", null=True, blank=True, on_delete=models.SET_NULL, related_name="active_player_4")

    def __str__(self):
        return str(self.user.username)

@receiver(post_save, sender=User)
def create_pong_session(sender, instance, created, **kwargs):
    if created:
        with transaction.atomic():
            session, session_created = PongSession.objects.get_or_create(user=instance)
            if session_created or not session.active_player_1:
                session.active_player_1 = PongPlayer.objects.create(player_session=session, player_name="Player 1", avatar=settings.media_root / 'default-avatar.png' if settings.media_root else '/media/avatars/default-avatar.png')
                session.active_player_2 = PongPlayer.objects.create(player_session=session, player_name="Player 2", avatar=settings.media_root / 'default-avatar.png' if settings.media_root else '/media/avatars/default-avatar.png')
                session.active_player_3 = PongPlayer.objects.create(player_session=session, player_name="Player 3", avatar=settings.media_root / 'default-avatar.png' if settings.media_root else '/media/avatars/default-avatar.png')
                session.active_player_4 = PongPlayer.objects.create(player_session=session, player_name="Player 4", avatar=settings.media_root / 'default-avatar.png' if settings.media_root else '/media/avatars/default-avatar.png')
                session.save()

# Signal to create GameSettings
@receiver(post_save, sender=User)
def create_game_settings(sender, instance, created, **kwargs):
    if created:
        GameSettings.objects.get_or_create(user=instance)

# Commented out as it seems incomplete and unused
# def change_player_names(sender, instance, created, **kwargs):
#     if created:
#         session = PongSession.objects.create(user=instance)
#         session.active_player_1 = PongPlayer.objects.change(player_session=session, player_name=kwargs)
#         session.active_player_2 = PongPlayer.objects.change(player_session=session, player_name="Player 2")
#         session.active_player_3 = PongPlayer.objects.change(player_session=session, player_name="Player 3")
#         session.active_player_4 = PongPlayer.objects.change(player_session=session, player_name="Player 4")
#     instance.pongsession.save()

class PongPlayer(models.Model):
    player_session = models.ForeignKey(PongSession, on_delete=models.CASCADE)
    player_name = models.CharField(max_length=30, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, default='/media/avatars/default-avatar.png')

    class Meta:
        constraints = [models.UniqueConstraint(fields=['player_session', 'player_name'], name='Unique player names for each session')]
	
    def __str__(self):
        return self.player_name or "Unnamed Player"

class PongGame(models.Model):
    game_type = models.CharField(max_length=4, blank=False, null=False)
    game_score = models.CharField(null=True, blank=True)
    game_session = models.ForeignKey(PongSession, on_delete=models.CASCADE)
    game_winner_1 = models.ForeignKey(PongPlayer, null=True, blank=True, on_delete=models.SET_NULL, related_name="game_winner_1")
    game_winner_2 = models.ForeignKey(PongPlayer, null=True, blank=True, on_delete=models.SET_NULL, related_name="game_winner_2")
    game_loser_1 = models.ForeignKey(PongPlayer, null=True, blank=True, on_delete=models.SET_NULL, related_name="game_loser_1")
    game_loser_2 = models.ForeignKey(PongPlayer, null=True, blank=True, on_delete=models.SET_NULL, related_name="game_loser_2")
	
    def __str__(self):
        return f"Game {self.id} ({self.game_type})"

class PongTournament(models.Model):
    tournament_type = models.CharField(max_length=4, blank=False, null=False)
    tournament_session = models.ForeignKey(PongSession, on_delete=models.CASCADE)
    semi_one_p1 = models.ForeignKey(PongPlayer, null=False, blank=False, on_delete=models.CASCADE, related_name="semi_one_p1")
    semi_one_p2 = models.ForeignKey(PongPlayer, null=False, blank=False, on_delete=models.CASCADE, related_name="semi_one_p2")
    semi_two_p1 = models.ForeignKey(PongPlayer, null=False, blank=False, on_delete=models.CASCADE, related_name="semi_two_p1")
    semi_two_p2 = models.ForeignKey(PongPlayer, null=False, blank=False, on_delete=models.CASCADE, related_name="semi_two_p2")

    tournament_game_1 = models.ForeignKey(PongGame, null=True, blank=True, on_delete=models.CASCADE, related_name="tournament_game_1")
    tournament_game_2 = models.ForeignKey(PongGame, null=True, blank=True, on_delete=models.CASCADE, related_name="tournament_game_2")
    tournament_game_3 = models.ForeignKey(PongGame, null=True, blank=True, on_delete=models.CASCADE, related_name="tournament_game_3")

    def __str__(self):
        return f"Tournament {self.id} ({self.tournament_type})"

from django.db import models
from django.conf import settings

class GameSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    game_speed = models.CharField(max_length=10, choices=[('slow', 'Slow'), ('normal', 'Normal'), ('fast', 'Fast')], default='normal')
    ball_size = models.CharField(max_length=10, choices=[('small', 'Small'), ('medium', 'Medium'), ('large', 'Large')], default='medium')
    paddle_size = models.CharField(max_length=10, choices=[('short', 'Short'), ('normal', 'Normal'), ('long', 'Long')], default='normal')
    power_jump = models.CharField(max_length=10, choices=[('on', 'On'), ('off', 'Off')], default='on')
    theme = models.CharField(max_length=10, choices=[('light', 'Light'), ('dark', 'Dark')], default='light')
    font_size = models.CharField(max_length=10, choices=[('small', 'Small'), ('medium', 'Medium'), ('large', 'Large')], default='medium')
    language = models.CharField(max_length=10, choices=[('eng', 'English'), ('fin', 'Finnish'), ('swd', 'Swedish')], default='eng')
    # Optional media configuration
    custom_media_root = models.CharField(max_length=255, blank=True, null=True, help_text="Custom media root path (optional)")
    custom_media_url = models.CharField(max_length=255, blank=True, null=True, help_text="Custom media URL (optional)")
    default_avatar_url = models.CharField(max_length=255, blank=True, null=True, help_text="Custom default avatar URL (optional)")

    def __str__(self):
        return f"Settings for {self.user.username}"

    @property
    def media_root(self):
        return self.custom_media_root if self.custom_media_root else settings.MEDIA_ROOT

    @property
    def media_url(self):
        return self.custom_media_url if self.custom_media_url else settings.MEDIA_URL

    @property
    def default_avatar_url(self):
        return self.default_avatar_url if self.default_avatar_url else f"{self.media_url}avatars/default-avatar.png"