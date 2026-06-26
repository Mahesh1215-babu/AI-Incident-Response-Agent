import os
import hashlib
import jwt
from datetime import datetime, timedelta
from typing import Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Load env variables
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretjwtkeyforincidentagent12345!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# Secure Hashing with auto fallback
def hash_password(password: str) -> str:
    """
    Hash a password. Tries to use bcrypt if available, otherwise falls back to PBKDF2.
    """
    try:
        import bcrypt
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return f"bcrypt${hashed.decode('utf-8')}"
    except Exception:
        # Fallback to PBKDF2-HMAC-SHA256
        salt = os.urandom(16)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return f"pbkdf2${salt.hex()}${key.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash, matching the hash algorithm used.
    """
    if hashed_password.startswith("bcrypt$"):
        try:
            import bcrypt
            raw_hash = hashed_password.split("$", 1)[1]
            return bcrypt.checkpw(password.encode('utf-8'), raw_hash.encode('utf-8'))
        except Exception:
            return False
    elif hashed_password.startswith("pbkdf2$"):
        try:
            parts = hashed_password.split("$")
            salt = bytes.fromhex(parts[1])
            stored_key = bytes.fromhex(parts[2])
            key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
            return key == stored_key
        except Exception:
            return False
    else:
        # Check raw plain text fallback if any, or general comparison
        return hashlib.sha256(password.encode('utf-8')).hexdigest() == hashed_password

# JWT Helpers
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

async def get_current_user_from_token(token: str = Depends(oauth2_scheme)) -> dict:
    from backend.database.db import get_db_collection
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("email")
    if email is None:
        raise credentials_exception
    
    users_col = get_db_collection("users")
    user = await users_col.find_one({"email": email})
    if user is None:
        raise credentials_exception
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role", "engineer"),
        "created_at": user.get("created_at")
    }

async def get_admin_user(current_user: dict = Depends(get_current_user_from_token)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted to administrators only."
        )
    return current_user
