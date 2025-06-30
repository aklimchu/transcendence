from django.urls import path
from . import views
from pong.views import TwoFADisableView, TwoFAStatus, TwoFASetupView, TwoFAVerifyView, login_with_2fa


urlpatterns = [
    path("pong_register/", views.pong_register, name="pong_register"),
    path("pong_session_data/", views.pong_session_data, name="pong_session_data"),
    path("pong_stats_data/", views.pong_stats_data, name="pong_stats_data"),
    path("pong_push_game/", views.pong_push_game, name="pong_push_game"),
    path("pong_create_tournament/", views.pong_create_tournament, name="pong_create_tournament"),
	path("pong_settings/", views.pong_update_settings, name="pong_update_settings"),
	path("2fa/disable/", TwoFADisableView.as_view()),
	path("2fa/status/", TwoFAStatus, name="2fa_status"),
	path("2fa/setup/", TwoFASetupView.as_view(), name="2fa_setup"),
	path("2fa/verify/", TwoFAVerifyView.as_view(), name="2fa_verify"),
    path("login_with_2fa/", login_with_2fa, name="login_with_2fa"),
]
