from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/whatsapp_clone/chat/(?P<username>\w+)/(?P<chatname>\w+)/$", consumers.ChatConsumer.as_asgi()),
]