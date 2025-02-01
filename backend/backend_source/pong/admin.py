from django.contrib import admin

# Test model 1
from .models import TestModel

# Register your models here.
admin.site.register(TestModel)