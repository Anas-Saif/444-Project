## utils
from fastapi import HTTPException,status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
## Dependency
from db.schema import User
from db.db_engine import DB_session
from services.Auth import Auth

## models
from models.req.user import User_signup as user_signup_model
from models.req.user import User_login as user_login_model
from models.res.user import Token as token_model

class Users():
    def __init__(self):
        self.db_session = DB_session()
        self.auth_service = Auth()

    async def get_user_by_email(self,email: str) -> User:
        try:
            async with self.db_session as session:
                stmnt=select(User).where(User.email == email)
                result = await session.execute(stmnt)
                return result.scalars().first()
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e)

    async def create_user(self,user: user_signup_model) -> User:
        if await self.get_user_by_email(user.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="unable to create user")
        new_user = User(
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            password_hash= await self.auth_service.hash_password(user.password)
        )
        try:
            async with self.db_session as session:
                session.add(new_user)
                await session.commit()
                await session.refresh(new_user)
                return new_user
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="unable to create user")
        
    async def get_user_by_id(self,id: int) -> User:
        try:
            async with self.db_session as session:
                stmnt = select(User).where(User.user_id == id)
                result = await session.execute(stmnt)
                return result.scalars().first()
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="unable to fetch user")
    
    async def login_user(self,loginform:OAuth2PasswordRequestForm) -> token_model:
        user = await self.get_user_by_email(loginform.username)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
        if not await self.auth_service.verify_password(loginform.password,user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        access_token = await self.auth_service.generate_jwt_token(user.user_id)
        return token_model(access_token=access_token,token_type= "bearer")

