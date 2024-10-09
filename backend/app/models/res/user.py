## utils
from pydantic import BaseModel

class User(BaseModel):
    user_id: int
    email: str
    first_name: str
    last_name: str
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class User_login(BaseModel):
    user:User
    access_token: Token