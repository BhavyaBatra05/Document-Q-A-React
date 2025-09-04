from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
from typing import Optional

# Create router
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# Schema for token response
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema for user login
class UserLogin(BaseModel):
    username: str
    password: str

# Schema for user registration
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

# For demo purposes - replace with database in production
DEMO_USERS = {
    "admin": {
        "username": "admin",
        "email": "admin@example.com",
        "password": "admin123",  # In production, store hashed passwords
        "is_admin": True
    },
    "user": {
        "username": "user",
        "email": "user@example.com",
        "password": "user123",
        "is_admin": False
    }
}

# Secret key for JWT token
SECRET_KEY = "your-secret-key"  # Use a strong secret key in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# OAuth2 bearer token for authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Create access token
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Login endpoint
@router.post("/login", response_model=Token)
async def login_for_access_token(user_data: UserLogin):
    print(f"Login attempt for user: {user_data.username}")
    user = DEMO_USERS.get(user_data.username)
    
    if not user or user["password"] != user_data.password:
        print("Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.username, "is_admin": user.get("is_admin", False)},
        expires_delta=access_token_expires
    )
    
    print(f"Login successful for user: {user_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

# Get current user
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        
        user = DEMO_USERS.get(username)
        if user is None:
            raise credentials_exception
        
        return user
    except jwt.PyJWTError:
        raise credentials_exception

# User profile endpoint
@router.get("/profile")
async def get_user_profile(current_user = Depends(get_current_user)):
    return {
        "id": 1,  # In production, use real user ID
        "username": current_user["username"],
        "email": current_user["email"],
        "is_admin": current_user.get("is_admin", False)
    }

# Registration endpoint
@router.post("/register", response_model=Token)
async def register_user(user_data: UserCreate):
    # Check if username already exists
    if user_data.username in DEMO_USERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # In production, hash the password
    DEMO_USERS[user_data.username] = {
        "username": user_data.username,
        "email": user_data.email,
        "password": user_data.password,  # Store hashed password in production
        "is_admin": False  # New users are not admins by default
    }
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.username, "is_admin": False},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}