"""Authentication routes for Google OAuth."""

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.schemas import TokenResponse, UserResponse
from app.services.auth_service import auth_service
from app.api.dependencies import get_current_user, User

router = APIRouter(prefix="/auth", tags=["authentication"])

# Google OAuth URLs
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def is_production() -> bool:
    """Check if we're running in production."""
    return "vercel.app" in settings.frontend_url or "investiq" in settings.frontend_url


def get_google_redirect_uri() -> str:
    """Get the OAuth callback URL based on environment."""
    if is_production():
        return "https://investiq-ai.onrender.com/api/v1/auth/google/callback"
    return "http://localhost:8000/api/v1/auth/google/callback"


def get_frontend_url() -> str:
    """Get the frontend URL based on environment."""
    return settings.frontend_url


@router.get("/google/login")
async def google_login():
    """
    Initiate Google OAuth login flow.
    Returns the URL to redirect the user to Google's login page.
    """
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    redirect_uri = get_google_redirect_uri()
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    auth_url = f"{GOOGLE_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Google OAuth callback.
    Exchanges the authorization code for tokens and creates/updates user.
    """
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    redirect_uri = get_google_redirect_uri()
    frontend_url = get_frontend_url()

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )

        if token_response.status_code != 200:
            # Redirect to frontend with error
            return RedirectResponse(
                url=f"{frontend_url}?auth_error=token_exchange_failed"
            )

        tokens = token_response.json()
        access_token = tokens.get("access_token")

        # Get user info from Google
        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if userinfo_response.status_code != 200:
            return RedirectResponse(
                url=f"{frontend_url}?auth_error=userinfo_failed"
            )

        userinfo = userinfo_response.json()

    # Get or create user in database
    user = await auth_service.get_or_create_user(
        db=db,
        google_id=userinfo["id"],
        email=userinfo["email"],
        name=userinfo.get("name"),
        picture=userinfo.get("picture"),
    )

    # Create JWT token
    jwt_token = auth_service.create_access_token({"sub": str(user.id)})

    # Redirect to frontend with token
    return RedirectResponse(
        url=f"{frontend_url}?token={jwt_token}"
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User | None = Depends(get_current_user),
):
    """Get current authenticated user info."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout():
    """
    Logout endpoint.
    The actual logout happens on the frontend by removing the token.
    This endpoint just confirms the action.
    """
    return {"message": "Logged out successfully"}
