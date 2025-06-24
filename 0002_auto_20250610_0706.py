from django.db import migrations, models
from django.contrib.auth.models import User

class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ('auth', '__latest__'),
    ]

    operations = [
        migrations.CreateModel(
            name='PongSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user', models.OneToOneField(on_delete=models.CASCADE, to='auth.User')),
                ('active_player_1', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='active_player_1', to='pong.PongPlayer')),
                ('active_player_2', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='active_player_2', to='pong.PongPlayer')),
                ('active_player_3', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='active_player_3', to='pong.PongPlayer')),
                ('active_player_4', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='active_player_4', to='pong.PongPlayer')),
            ],
        ),
        migrations.CreateModel(
            name='PongPlayer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('player_session', models.ForeignKey(on_delete=models.CASCADE, to='pong.PongSession')),
                ('player_name', models.CharField(blank=True, max_length=30, null=True)),
            ],
            options={
                'constraints': [
                    models.UniqueConstraint(fields=['player_session', 'player_name'], name='Unique player names for each session')
                ],
            },
        ),
        migrations.CreateModel(
            name='PongGame',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('game_type', models.CharField(max_length=4)),
                ('game_score', models.CharField(blank=True, null=True)),
                ('game_session', models.ForeignKey(on_delete=models.CASCADE, to='pong.PongSession')),
                ('game_winner_1', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='game_winner_1', to='pong.PongPlayer')),
                ('game_winner_2', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='game_winner_2', to='pong.PongPlayer')),
                ('game_loser_1', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='game_loser_1', to='pong.PongPlayer')),
                ('game_loser_2', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='game_loser_2', to='pong.PongPlayer')),
            ],
        ),
        migrations.CreateModel(
            name='PongTournament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tournament_type', models.CharField(max_length=4)),
                ('tournament_session', models.ForeignKey(on_delete=models.CASCADE, to='pong.PongSession')),
                ('semi_one_p1', models.ForeignKey(on_delete=models.CASCADE, related_name='semi_one_p1', to='pong.PongPlayer')),
                ('semi_one_p2', models.ForeignKey(on_delete=models.CASCADE, related_name='semi_one_p2', to='pong.PongPlayer')),
                ('semi_two_p1', models.ForeignKey(on_delete=models.CASCADE, related_name='semi_two_p1', to='pong.PongPlayer')),
                ('semi_two_p2', models.ForeignKey(on_delete=models.CASCADE, related_name='semi_two_p2', to='pong.PongPlayer')),
                ('tournament_game_1', models.ForeignKey(blank=True, null=True, on_delete=models.CASCADE, related_name='tournament_game_1', to='pong.PongGame')),
                ('tournament_game_2', models.ForeignKey(blank=True, null=True, on_delete=models.CASCADE, related_name='tournament_game_2', to='pong.PongGame')),
                ('tournament_game_3', models.ForeignKey(blank=True, null=True, on_delete=models.CASCADE, related_name='tournament_game_3', to='pong.PongGame')),
            ],
        ),
        migrations.CreateModel(
            name='GameSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user', models.OneToOneField(on_delete=models.CASCADE, to='auth.User')),
                ('game_speed', models.CharField(choices=[('slow', 'Slow'), ('normal', 'Normal'), ('fast', 'Fast')], default='normal', max_length=10)),
                ('ball_size', models.CharField(choices=[('small', 'Small'), ('medium', 'Medium'), ('large', 'Large')], default='medium', max_length=10)),
                ('paddle_size', models.CharField(choices=[('short', 'Short'), ('normal', 'Normal'), ('long', 'Long')], default='normal', max_length=10)),
                ('power_jump', models.CharField(choices=[('on', 'On'), ('off', 'Off')], default='on', max_length=10)),
                ('theme', models.CharField(choices=[('light', 'Light'), ('dark', 'Dark')], default='light', max_length=10)),
                ('font_size', models.CharField(choices=[('small', 'Small'), ('medium', 'Medium'), ('large', 'Large')], default='medium', max_length=10)),
                ('language', models.CharField(choices=[('eng', 'English'), ('fin', 'Finnish'), ('swd', 'Swedish')], default='eng', max_length=10)),
            ],
        ),
    ]