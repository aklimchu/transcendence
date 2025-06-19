from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('pong', '0001_initial'),  # Adjust based on your last migration
    ]

    operations = [
        migrations.AddField(
            model_name='pongplayer',
            name='avatar',
            field=models.ImageField(upload_to='avatars/', null=True, blank=True),
        ),
    ]