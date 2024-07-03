from django.urls import path
from . import views

urlpatterns = [
    path("chat/<str:username>/", views.index, name="index"),
    path("login/", views.login_view, name="login_view"),
    path("register/", views.register, name="register"),
    path("logout/", views.logout_view, name="logout_view"),
    path("chat/<str:username>/upload/", views.upload_view, name="upload_view"),
]