"""Authentication service for Google OAuth and JWT handling."""

from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import User


class AuthService:
    """Service for authentication operations."""

    def create_access_token(self, data: dict, expires_delta: timedelta | None = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (
            expires_delta or timedelta(minutes=settings.jwt_expire_minutes)
        )
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    def decode_token(self, token: str) -> dict | None:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(
                token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
            )
            return payload
        except JWTError:
            return None

    async def get_or_create_user(
        self,
        db: AsyncSession,
        google_id: str,
        email: str,
        name: str | None = None,
        picture: str | None = None,
    ) -> User:
        """Get existing user or create new one from Google OAuth data."""
        # Try to find existing user by google_id
        result = await db.execute(
            select(User).where(User.google_id == google_id)
        )
        user = result.scalar_one_or_none()

        if user:
            # Update last login and any changed profile data
            user.last_login = datetime.now(timezone.utc)
            if name:
                user.name = name
            if picture:
                user.picture = picture
            await db.flush()
            await db.refresh(user)
            return user

        # Create new user
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            picture=picture,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def get_user_by_id(self, db: AsyncSession, user_id: int) -> User | None:
        """Get user by ID."""
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()


auth_service = AuthService()
