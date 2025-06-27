from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('pong', '0001_initial'),  # Adjust to your latest migration (check pong/migrations/)
    ]

    operations = [
        migrations.AddField(
            model_name='pongplayer',
            name='avatar',
            field=models.ImageField(default='/media/avatars/default-avatar.png', null=True, blank=True, upload_to='avatars/'),
        ),
    ]