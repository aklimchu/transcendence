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
        PongSession.objects.create(user=instance)
    instance.pongsession.save()

# On signal delete user connected to PongSession
@receiver(post_delete, sender=PongSession)
def delete_pong_session(sender, instance, **kwargs):
    if instance.user:
        instance.user.delete()