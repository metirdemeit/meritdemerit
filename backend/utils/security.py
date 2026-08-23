import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Union

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer

from backend.models import Student, Teacher, Admin

# --- Environment Variables ---
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is required")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
# Default access token expiration: 525,600 minutes (1 year) for persistent device sessions
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 525600))



# --- Password Handling ---
def verify_password(plain_password: str, stored_password: str) -> bool:
    return plain_password == stored_password


# --- JWT Token Handling ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


# --- User Authentication Dependency ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = None
    if role == "student":
        user = await Student.get_or_none(id=int(user_id))
    elif role == "teacher":
        user = await Teacher.get_or_none(id=int(user_id))
    elif role == "admin":
        user = await Admin.get_or_none(id=int(user_id))

    if user is None:
        raise credentials_exception

    # You can add a 'disabled' flag to the user model to handle disabled accounts
    # if user.disabled:
    #     raise HTTPException(status_code=400, detail="Inactive user")

    return user


async def get_current_admin(current_user: Union[Student, Teacher, Admin] = Depends(get_current_user)) -> Admin:
    if not isinstance(current_user, Admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action. Admin access required.",
        )
    return current_user


ALLOWED_INSECURE_HOSTS = {"127.0.0.1", "localhost"}


async def enforce_https(request: Request):
    """
    Ensure that requests are made over HTTPS (with exceptions for local development).
    """
    scheme = request.url.scheme
    host = request.url.hostname
    forwarded_proto = request.headers.get("x-forwarded-proto") or request.headers.get("X-Forwarded-Proto")

    # Accept HTTPS or correctly terminated HTTPS behind a proxy
    if scheme == "https" or forwarded_proto == "https":
        return

    # Allow HTTP for local development, unless explicitly disabled
    allow_http_local = os.getenv("ALLOW_HTTP_LOCAL", "true").lower() in {"1", "true", "yes"}
    if host in ALLOWED_INSECURE_HOSTS and allow_http_local:
        return

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="HTTPS is required for this endpoint.",
    )
