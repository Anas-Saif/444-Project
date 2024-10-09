## utils
from fastapi import APIRouter, Depends, status
from typing import List
import pytz
## models
from models.req.task import TaskCreate, TaskUpdate
from models.res.task import TaskOut
## services
from services.Auth import Auth as AuthService
from services.tasks import TaskService

## dependency
def get_tasks_service():
    return TaskService()

auth_service = AuthService()
RIYADH_TZ = pytz.timezone('Asia/Riyadh')


## config
router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    user_id: int = Depends(auth_service.get_current_user),
    task_service: TaskService = Depends(get_tasks_service)
):
    if task_data.due_date.tzinfo is None:
        # If no time zone is provided, assume Riyadh time
        task_data.due_date = RIYADH_TZ.localize(task_data.due_date)
    # Convert to UTC
    task_data.due_date = task_data.due_date.astimezone(pytz.utc)
    # Proceed to create the task
    return await task_service.create_task(user_id, task_data)

@router.get("/", response_model=List[TaskOut], status_code=status.HTTP_200_OK)
async def get_tasks(
    user_id: int = Depends(auth_service.get_current_user),
    task_service: TaskService = Depends(get_tasks_service)
):
    return await task_service.get_tasks(user_id)

@router.get("/{task_id}", response_model=TaskOut, status_code=status.HTTP_200_OK)
async def get_task(
    task_id: int,
    user_id: int = Depends(auth_service.get_current_user),
    task_service: TaskService = Depends(get_tasks_service)
    ):
    return await task_service.get_task(user_id, task_id) 

@router.put("/{task_id}", response_model=TaskOut, status_code=status.HTTP_200_OK)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    user_id: int = Depends(auth_service.get_current_user),
    task_service: TaskService = Depends(get_tasks_service)
):
    return await task_service.update_task(user_id, task_id, task_data)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    user_id: int = Depends(auth_service.get_current_user),
    task_service: TaskService = Depends(get_tasks_service)
):
    await task_service.delete_task(user_id, task_id)
    return {"message": "Task deleted successfully"}

@router.patch("/{task_id}/complete", response_model=TaskOut, status_code=status.HTTP_200_OK)
async def mark_task_completed(
    task_id: int,
    user_id: int = Depends(auth_service.get_current_user),
    task_service: TaskService = Depends(get_tasks_service)
):
    return await task_service.mark_task_completed(user_id, task_id)