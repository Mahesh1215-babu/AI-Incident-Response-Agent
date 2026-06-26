from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from backend.models.schemas import UserSignup, UserLogin, Token, UserResponse
from backend.database.db import get_db_collection
from backend.utils.helpers import hash_password, verify_password, create_access_token

router = APIRouter(tags=["Authentication"])

@router.post("/signup", response_model=UserResponse)
async def signup(user_data: UserSignup):
    users_col = get_db_collection("users")
    
    # Check if user already exists
    existing_user = await users_col.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Check if this is the first user registered in the system
    total_users = await users_col.count_documents({})
    assigned_role = user_data.role if user_data.role else "engineer"
    
    # If first user, make admin, or if email matches admin@incidentagent.com
    if total_users == 0 or user_data.email.lower() == "admin@incidentagent.com":
        assigned_role = "admin"
        
    hashed_pwd = hash_password(user_data.password)
    
    new_user = {
        "email": user_data.email.lower(),
        "password": hashed_pwd,
        "role": assigned_role,
        "created_at": datetime.utcnow().isoformat()
    }
    
    res = await users_col.insert_one(new_user)
    
    return {
        "id": str(res.inserted_id),
        "email": new_user["email"],
        "role": new_user["role"],
        "created_at": new_user["created_at"]
    }

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    users_col = get_db_collection("users")
    email = user_data.email.lower()
    
    # Support seeding admin on the fly if login is admin@incidentagent.com and no users exist
    user = await users_col.find_one({"email": email})
    if not user and email == "admin@incidentagent.com":
        # Create default admin on the fly
        hashed_pwd = hash_password("adminpassword")
        admin_user = {
            "email": email,
            "password": hashed_pwd,
            "role": "admin",
            "created_at": datetime.utcnow().isoformat()
        }
        await users_col.insert_one(admin_user)
        user = admin_user
        print("Default admin user created: admin@incidentagent.com / adminpassword")
        
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate JWT
    access_token = create_access_token(data={"email": user["email"], "role": user.get("role", "engineer")})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.get("role", "engineer"),
        "email": user["email"]
    }

@router.post("/logout")
async def logout():
    # Since we are using JWT tokens, stateless logout is handled client-side.
    # The endpoint simply sends a confirmation message.
    return {"message": "Logout successful"}
