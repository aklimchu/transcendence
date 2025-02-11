from django.contrib import admin
from .models import PongSession
from .models import PongPlayer
from .models import PongGame
from .models import PongTournament

# Register your models here.
admin.site.register(PongSession)
admin.site.register(PongPlayer)
admin.site.register(PongGame)
admin.site.register(PongTournament)