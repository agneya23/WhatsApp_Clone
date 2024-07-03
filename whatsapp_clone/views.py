from django.shortcuts import render, redirect, HttpResponse
from django.http import JsonResponse
from . import forms
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from pymongo import MongoClient
import datetime
import json
import hashlib
import os

client = MongoClient("mongodb+srv://agneya23:Brunoduma0*@whatsappclone.gpxwn9p.mongodb.net/?retryWrites=true&w=majority&appName=WhatsAppClone")
db = client.whatsapp_clone_db
users_collection = db.users
chats_collection = db.chats
messages_collection = db.messages

@login_required(login_url="/whatsapp_clone/login/")
def index(request, username):
    if request.method == "POST":
        data_dict = json.loads(request.body)
        if 'sender' in data_dict:
            data_dict["created_at"] = datetime.datetime.now()
            data_dict["updated_at"] = datetime.datetime.now()
            messages_collection.insert_one(data_dict)
            query = {"chat_hash": data_dict['chat_hash']}
            results = messages_collection.find(query, {'sender': 1, 'content': 1}).sort("created_at", 1)
            message_list = []
            for document in results:
                message_list.append([document['sender'], document['content']])
            data = {'message_list': message_list}
        elif 'chat_hash' in data_dict:
            query = {"chat_hash": data_dict['chat_hash']}
            results = messages_collection.find(query, {'sender': 1, 'content': 1}).sort("created_at", 1)
            message_list = []
            for document in results:
                message_list.append([document['sender'], document['content']])
            data = {'message_list': message_list}
        else:
            name, participants = data_dict["name"], data_dict["participants"]
            hash_object = hashlib.md5(name.encode())
            chats_collection.insert_one({"chat_name": name, "chat_hash": hash_object.hexdigest(), "participants": participants, "created_at": datetime.datetime.now(), "updated_at": datetime.datetime.now()})
            query = {"participants": {"$in": [username]}}
            results = chats_collection.find(query, {'chat_name': 1, 'chat_hash': 1}).sort("created_at", -1)
            chat_dict = {}
            for document in results:
                if "+" in document['chat_name']:
                    user1, user2 = document["chat_name"].split("+")
                    if user1 == username:
                        chat_dict[user2] = document["chat_hash"]
                    else:
                        chat_dict[user1] = document["chat_hash"]
                else:
                    chat_dict[document['chat_name']] = document["chat_hash"]
            data = {'chat_dict': chat_dict}
        return JsonResponse(data)
    else:
        query = {"participants": {"$in": [username]}}
        results = chats_collection.find(query, {'chat_name': 1, 'chat_hash': 1}).sort("created_at", -1)
        chat_dict = {}
        for document in results:
            if "+" in document['chat_name']:
                user1, user2 = document["chat_name"].split("+")
                if user1 == username:
                    chat_dict[user2] = document["chat_hash"]
                else:
                    chat_dict[user1] = document["chat_hash"]
            else:
                chat_dict[document['chat_name']] = document["chat_hash"]
        chat_list, chat_hash_list = chat_dict.keys(), chat_dict.values()
        context = {'combined_list': list(zip(chat_list, chat_hash_list)), 'username': username}
        return render(request, "whatsapp_clone/index.html", context)

def register(request):
    form = forms.RegisterForm()
    context = {"form": form}
    if request.method == "POST":
        form = forms.RegisterForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data.get("username")
            email = form.cleaned_data.get("email")
            password = form.cleaned_data.get("password")
            User.objects.create_user(username=username, email=email, password=password)
            messages.add_message(request, messages.SUCCESS, "Successfully Registered!")
            users_collection.insert_one({'username': username, 'profile_picture': '', 'created_at': datetime.datetime.now()})
            return redirect("login_view")
    return render(request, "whatsapp_clone/register.html", context)

def login_view(request):
    form = forms.LoginForm()
    context = {"form": form}
    next_url = request.GET.get("next", None)
    if request.method == "POST":
        form = forms.LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")
            user = authenticate(request, username=username, password=password)
            if user:
                login(request, user)
                messages.add_message(request, messages.SUCCESS, "Logged In!")
                if next_url:
                    return redirect(next_url)
                return redirect("index", username)
            else:
                messages.add_message(request, messages.ERROR, "Either username or password entered is incorrect")
    return render(request, "whatsapp_clone/login.html", context)

def logout_view(request):
    logout(request)
    return redirect("login_view")

def upload_view(request, username):
    if request.FILES:
        filename_lst = json.loads(request.POST.get("filename_lst"))
        metadata = json.loads(request.POST.get("metadata"))
        if not os.path.exists("./uploaded_files/"):
            os.mkdir("./uploaded_files/")
        if not os.path.exists("./uploaded_files/"+metadata["chat_hash"]+"/"):
            os.mkdir("./uploaded_files/"+metadata["chat_hash"]+"/")
        for filename in filename_lst:
            file = request.FILES[filename]
            with open("./uploaded_files/"+metadata["chat_hash"]+"/"+filename, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
        # Add to mongodb the path to file etc.
    return HttpResponse({"message_list": []})
