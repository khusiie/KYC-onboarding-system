import os
import django

# Setup Django before importing models
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import authenticate
from kyc.models import User

def check_user():
    username = 'reviewer1'
    password = '123'  # The new simple password
    
    user = User.objects.filter(username=username).first()
    if not user:
        print(f"ERROR: User '{username}' does not exist in the database.")
        return

    print(f"User found: {user.username}")
    print(f"User active: {user.is_active}")
    print(f"User role: {user.role}")
    
    auth_user = authenticate(username=username, password=password)
    if auth_user:
        print(f"SUCCESS: Authentication worked for password '{password}'!")
    else:
        print(f"FAILURE: Authentication failed for password '{password}'.")

if __name__ == "__main__":
    check_user()
