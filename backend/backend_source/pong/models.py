from django.db import models
from django.contrib.auth.models import User

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# Create your models here.

class PongSession(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    text_field = models.TextField(blank=True, null=True)
    def __str__(self):
        return self.user.username

# On signal create PongSession for User
@receiver(post_save, sender=User)
def create_pong_session(sender, instance, created, **kwargs):
    if created:
        session = PongSession.objects.create(user=instance)
        PongPlayer.objects.create(player_session = session, player_name = "Player 1")
        PongPlayer.objects.create(player_session = session, player_name = "Player 2")
        PongPlayer.objects.create(player_session = session, player_name = "Player 3")
        PongPlayer.objects.create(player_session = session, player_name = "Player 4")
    instance.pongsession.save()


class PongPlayer(models.Model):
    player_session = models.ForeignKey(PongSession, on_delete=models.CASCADE)
    player_name = models.CharField(max_length=30, blank=True, null=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['player_session', 'player_name'], name='Unique player names for each session')]