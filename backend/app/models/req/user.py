## utils
from pydantic import BaseModel,model_validator,Field,EmailStr


class User_signup(BaseModel):
    first_name: str = Field(..., min_length=1, description="First name cannot be empty")
    last_name: str = Field(..., min_length=1, description="Last name cannot be empty")
    email: EmailStr = Field(..., description="A valid email address is required")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

    # After validation to ensure no empty fields for names and validate password length
    @model_validator(mode='after')
    def validate_names_and_password(self) :
        if not self.first_name.strip():
            raise ValueError('First name cannot be empty')
        if not self.last_name.strip():
            raise ValueError('Last name cannot be empty')
        return self
    
class User_login(BaseModel):
    email: EmailStr = Field(..., description="A valid email address is required")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

    # After validation to ensure no empty fields for names and validate password length
    @model_validator(mode='after')
    def validate_password(self) :
        if not self.password.strip():
            raise ValueError('Password cannot be empty')
        return self

