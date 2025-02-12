from django.db import models
from django.contrib.auth.models import User

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# Create your models here.

class PongSession(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    active_player_1 = models.ForeignKey("PongPlayer", null=True, blank=True, on_delete=models.SET_NULL, related_name="active_player_1")
    active_player_2 = models.ForeignKey("PongPlayer", null=True, blank=True, on_delete=models.SET_NULL, related_name="active_player_2")
    active_player_3 = models.ForeignKey("PongPlayer", null=True, blank=True, on_delete=models.SET_NULL, related_name="active_player_3")
    active_player_4 = models.ForeignKey("PongPlayer", null=True, blank=True, on_delete=models.SET_NULL, related_name="active_player_4")

    def __str__(self):
        return self.user.username

# On signal create PongSession for User
@receiver(post_save, sender=User)
def create_pong_session(sender, instance, created, **kwargs):
    if created:
        session = PongSession.objects.create(user=instance)
        session.active_player_1 = PongPlayer.objects.create(player_session = session, player_name = "Player 1")
        session.active_player_2 = PongPlayer.objects.create(player_session = session, player_name = "Player 2")
        session.active_player_3 = PongPlayer.objects.create(player_session = session, player_name = "Player 3")
        session.active_player_4 = PongPlayer.objects.create(player_session = session, player_name = "Player 4")
    instance.pongsession.save()


class PongPlayer(models.Model):
    player_session = models.ForeignKey(PongSession, on_delete=models.CASCADE)
    player_name = models.CharField(max_length=30, blank=True, null=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['player_session', 'player_name'], name='Unique player names for each session')]

class PongGame(models.Model):
    game_score = models.CharField(null=True, blank=True)
    game_winner_1 = models.ForeignKey(PongPlayer, null=True, blank=True, on_delete=models.SET_NULL, related_name="game_winner_1")
    game_winner_2 = models.ForeignKey(PongPlayer, null=True, blank=True, on_delete=models.SET_NULL, related_name="game_winner_2")
    game_loser_1 = models.ForeignKey(PongPlayer, null=True, blank=True, on_delete=models.SET_NULL, related_name="game_loser_1")
    game_loser_2 = models.ForeignKey(PongPlayer, null=True, blank=True, on_delete=models.SET_NULL, related_name="game_loser_2")

class PongTournament(models.Model):
    tournament_session = models.ForeignKey(PongSession, on_delete=models.CASCADE)
    tournament_game_1 = models.ForeignKey(PongGame, null=True, blank=True, on_delete=models.CASCADE, related_name="tournament_game_1")
    tournament_game_2 = models.ForeignKey(PongGame, null=True, blank=True, on_delete=models.CASCADE, related_name="tournament_game_2")
    tournament_game_3 = models.ForeignKey(PongGame, null=True, blank=True, on_delete=models.CASCADE, related_name="tournament_game_3")