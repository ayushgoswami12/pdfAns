# FILE: auth.py

import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)


# ============================================================
# JWT CONFIGURATION
# ============================================================

JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is missing. "
        "Add JWT_SECRET to your .env file."
    )


JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


security = HTTPBearer()


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(
    password: str
) -> str:

    hashed = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    )

    return hashed.decode("utf-8")


def verify_password(
    password: str,
    password_hash: str,
) -> bool:

    try:

        result = bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )

        # TEMPORARY DEBUG
        print(
            "PASSWORD VERIFICATION RESULT:",
            result,
        )

        return result

    except Exception as e:

        print(
            "PASSWORD VERIFICATION ERROR:",
            repr(e),
        )

        return False


# ============================================================
# JWT TOKEN CREATION
# ============================================================

def create_access_token(
    user_id: int,
) -> str:

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            days=TOKEN_EXPIRE_DAYS
        )
    )

    payload = {
        "user_id": user_id,
        "exp": expire,
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )

    print(
        "ACCESS TOKEN CREATED FOR USER:",
        user_id,
    )

    return token


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[
                JWT_ALGORITHM
            ],
        )

        user_id = payload.get(
            "user_id"
        )

        if user_id is None:

            print(
                "JWT ERROR: user_id missing"
            )

            raise HTTPException(
                status_code=401,
                detail="Invalid token",
            )

        user_id = int(user_id)

        print(
            "JWT AUTHENTICATED USER:",
            user_id,
        )

        return user_id

    except jwt.ExpiredSignatureError:

        print(
            "JWT ERROR: token expired"
        )

        raise HTTPException(
            status_code=401,
            detail="Token has expired",
        )

    except jwt.InvalidTokenError:

        print(
            "JWT ERROR: invalid token"
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    except ValueError:

        print(
            "JWT ERROR: invalid user_id"
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )