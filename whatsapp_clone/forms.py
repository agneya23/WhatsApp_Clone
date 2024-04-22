from django import forms
from django.core.validators import EmailValidator

class LoginForm(forms.Form):
    username = forms.CharField(label="Username", max_length=100)
    password = forms.CharField(label="Password", widget=forms.PasswordInput(), max_length=100)

class RegisterForm(forms.Form):
    username = forms.CharField(label="Username", max_length=100)
    email = forms.EmailField(label="Email", max_length=100, validators=[EmailValidator])
    password = forms.CharField(label="Password", widget=forms.PasswordInput(), max_length=100)
    confirm_password = forms.CharField(label="Confirm Password", widget=forms.PasswordInput(), max_length=100)