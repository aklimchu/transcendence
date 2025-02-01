from django.db import models

# Create your models here.

class TestModel(models.Model):
    field1 = models.CharField(max_length=42)
    field2 = models.BooleanField(default=False)