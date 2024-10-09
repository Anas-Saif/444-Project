## utils
from fastapi import APIRouter, Depends, status
from typing import List
## models
from models.req.task import LabelCreate, LabelUpdate
from models.res.task import LabelOut
## services
from services.Auth import Auth as AuthService
from services.labels import LabelService

## dependency
def get_labels_service():
    return LabelService()

auth_service = AuthService()



## config
router = APIRouter(prefix="/labels", tags=["labels"])

@router.post("/", response_model=LabelOut, status_code=status.HTTP_201_CREATED)
async def create_label(
    label_data: LabelCreate,
    user_id: int = Depends(auth_service.get_current_user),
    label_service: LabelService = Depends(get_labels_service)
):
    return await label_service.create_label(user_id, label_data)

@router.get("/", response_model=List[LabelOut], status_code=status.HTTP_200_OK)
async def get_labels(
    user_id: int = Depends(auth_service.get_current_user),
    label_service: LabelService = Depends(get_labels_service)
):
    return await label_service.get_labels(user_id)

@router.get("/{label_id}", response_model=LabelOut, status_code=status.HTTP_200_OK)
async def get_label(
    label_id: int,
    user_id: int = Depends(auth_service.get_current_user),
    label_service: LabelService = Depends(get_labels_service)
):
    return await label_service.get_label(user_id, label_id)

@router.put("/{label_id}", response_model=LabelOut, status_code=status.HTTP_200_OK)
async def update_label(
    label_id: int,
    label_data: LabelUpdate,
    user_id: int = Depends(auth_service.get_current_user),
    label_service: LabelService = Depends(get_labels_service)
):
    return await label_service.update_label(user_id, label_id, label_data)

@router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_label(
    label_id: int,
    user_id: int = Depends(auth_service.get_current_user),
    label_service: LabelService = Depends(get_labels_service)
):
    await label_service.delete_label(user_id, label_id)
    return {"message": "Label deleted successfully"}
