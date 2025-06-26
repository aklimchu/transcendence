# Generated manually on 2025-06-26 16:30
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0003_gamesettings_custom_media_root_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='gamesettings',
            name='default_avatar_url',
            field=models.CharField(
                max_length=255,
                blank=True,
                null=True,
                help_text='Custom default avatar URL (optional)'
            ),
        ),
    ]