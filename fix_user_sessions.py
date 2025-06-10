from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from pong.models import PongSession, GameSettings, PongPlayer

class Command(BaseCommand):
    help = 'Creates PongSession and GameSettings for existing users'

    def handle(self, *args, **kwargs):
        for user in User.objects.all():
            # Create or get PongSession
            session, created = PongSession.objects.get_or_create(user=user)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created PongSession for {user.username}'))
                # Create players and assign to session
                session.active_player_1 = PongPlayer.objects.create(player_session=session, player_name="Player 1")
                session.active_player_2 = PongPlayer.objects.create(player_session=session, player_name="Player 2")
                session.active_player_3 = PongPlayer.objects.create(player_session=session, player_name="Player 3")
                session.active_player_4 = PongPlayer.objects.create(player_session=session, player_name="Player 4")
                session.save()
            else:
                self.stdout.write(self.style.WARNING(f'PongSession already exists for {user.username}'))
            # Create or get GameSettings
            settings, created = GameSettings.objects.get_or_create(user=user)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created GameSettings for {user.username}'))