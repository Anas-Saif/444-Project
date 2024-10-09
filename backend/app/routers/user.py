## utils
from fastapi import APIRouter,status,Depends
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
## models
from models.req.user import User_signup as user_signup_model
from models.res.user import Token as token_model
from models.res.user import User as user_model
## services
from services.users import Users
from services.Auth import Auth
## dependency
async def get_users_service():
    return Users()
async def get_auth_service():
    return Auth()
users_service_dep=Annotated[Users,Depends(get_users_service)]
auth_service=Auth()

## config
router = APIRouter(prefix="/user",tags=["user"])



@router.post("/singup",status_code=status.HTTP_201_CREATED)
async def signup_user(user: user_signup_model,users:Users=Depends(get_users_service)):
    user = await users.create_user(user)
    if user:
        return {"message":"User created successfully"}
    
@router.post("/login",status_code=status.HTTP_200_OK,response_model=token_model)
async def login_user(loginform:OAuth2PasswordRequestForm = Depends(),users:Users=Depends(get_users_service)):
    login_metadata = await users.login_user(loginform)
    return login_metadata

@router.get("/me",status_code=status.HTTP_200_OK,response_model=user_model)
async def get_user_me(user_id:int=Depends(auth_service.get_current_user),users:Users=Depends(get_users_service)):
    user= await users.get_user_by_id(user_id)
    return user