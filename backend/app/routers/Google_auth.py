## utils
from fastapi import APIRouter, Request, Depends, HTTPException
from typing import Annotated
from starlette.responses import RedirectResponse
## services
from services.google_calendar import GoogleCalendarService
from services.Auth import Auth

router = APIRouter(prefix="/auth", tags=["googel_auth"])

auth_service=Auth()

@router.get("/google")
async def auth_google(
    user_id:int=Depends(auth_service.get_current_user_cookie),
):
    google_service = GoogleCalendarService()
    authorization_url = await google_service.get_authorization_url()
    print (authorization_url)
    return RedirectResponse(authorization_url)

@router.get("/google/callback")
async def auth_google_callback(
    request: Request,
    user_id:int=Depends(auth_service.get_current_user_cookie),
    code:str=None
):
    code = request.query_params.get('code')
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not found")

    google_service = GoogleCalendarService()
    await google_service.fetch_and_store_credentials(user_id, code)

    # Redirect to frontend or success page
    return {"message": "Google Calendar sync successful !!"}
