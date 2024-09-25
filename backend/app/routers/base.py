## utils
from fastapi import APIRouter
## services


router = APIRouter()


@router.get("/")
async def read_root():
    return {"message": "hello student Pilot !!"}