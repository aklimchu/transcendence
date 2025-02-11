from django.contrib import admin
from .models import PongSession
from .models import PongPlayer

# Register your models here.
admin.site.register(PongSession)
admin.site.register(PongPlayer)