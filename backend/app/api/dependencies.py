"""API dependencies for authentication and authorization."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db, User
from app.services.auth_service import auth_service


# Security scheme for JWT bearer token
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """
    Get current authenticated user from JWT token.
    Returns None if no valid token is provided (guest user).
    """
    if not credentials:
        return None

    token = credentials.credentials
    payload = auth_service.decode_token(token)

    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    try:
        user_id = int(user_id)
    except ValueError:
        return None

    user = await auth_service.get_user_by_id(db, user_id)
    return user


async def require_auth(
    user: User | None = Depends(get_current_user),
) -> User:
    """
    Require authentication. Raises 401 if user is not authenticated.
    Use this dependency for routes that require login.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
