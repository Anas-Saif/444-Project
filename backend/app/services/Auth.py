## utils
import bcrypt
import jwt
from jwt import PyJWTError
import os
import datetime
from fastapi import HTTPException,Depends,status
from fastapi.security import OAuth2PasswordBearer
## services

## models

## config
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")

class Auth:
    def __init__(self):
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")
        self.ALGORITHM = os.getenv("ALGORITHM")
        self.SECRET_KEY = os.getenv("SECRET_KEY")
        self.TOKEN_EXP_TIME = int(os.getenv("TOKEN_EXP_TIME"))
        
        if not self.ALGORITHM or not self.SECRET_KEY or not self.TOKEN_EXP_TIME:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Configuration error, check the .env file")
        
    ## Hashing and verifying password
    async def hash_password(slef, password: str) -> str:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    async def verify_password(self, password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))

    ## generate JWT token
    async def generate_jwt_token(self, id:int,exp_delta:int=30) -> str:
        exp= datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=self.TOKEN_EXP_TIME)
        payload = {
                    "id": id,
                    "exp": exp
                    }
        try:
            token = jwt.encode(payload, self.SECRET_KEY, self.ALGORITHM)
            return token
        except PyJWTError as e:
            print(e)
            return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="unable to generate token")
        
    ## verify JWT token
    async def verify_token_access(self, token: str, credentials_exception: HTTPException) -> int:
        SECRET_KEY = os.getenv("SECRET_KEY")
        ALGORITHM = os.getenv("ALGORITHM")
        try:
            payload = jwt.decode(token, self.SECRET_KEY, algorithms=self.ALGORITHM)
            id:int = payload.get("id")
            if id is None:
                raise credentials_exception
        except PyJWTError as e:
            print(e)
            raise credentials_exception
        return id

    # get current user
    async def get_current_user(self,token: str = Depends(oauth2_scheme)) -> int:
        credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                            detail="Could not Validate Credentials",
                                            headers={"WWW-Authenticate": "Bearer"})
        user_id = await self.verify_token_access(token, credentials_exception)
        return user_id