## utils
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from fastapi import HTTPException, status
from datetime import datetime
import pytz
## Dependency
from db.db_engine import DB_session
from db.schema import Task, Label
## models
from models.req.task import TaskCreate, TaskUpdate
from models.res.task import TaskOut


class TaskService:
    def __init__(self):
        self.db_session: AsyncSession = DB_session()
        self.timezone = pytz.timezone('Asia/Riyadh')

    async def convert_to_riyadh_TZ(self, dt: datetime) -> datetime:
        if dt.tzinfo is None:
            # Assume UTC if no time zone is provided
            dt = dt.replace(tzinfo=pytz.utc)
        return dt.astimezone(self.timezone)

    async def create_task(self, user_id: int, task_data: TaskCreate) -> Task:
        async with self.db_session as session:
            try:
                labels = []
                if task_data.labels:
                    result = await session.execute(
                        select(Label).where(
                            Label.label_id.in_(task_data.labels),
                            Label.user_id == user_id
                        )
                    )
                    labels = result.scalars().all()
                    if len(labels) != len(task_data.labels):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="One or more labels not found or unauthorized"
                        )

                new_task = Task(
                    title=task_data.title,
                    description=task_data.description,
                    due_date=task_data.due_date,
                    is_completed=task_data.is_completed,
                    priority=task_data.priority,
                    user_id=user_id,
                    labels=labels
                )
                session.add(new_task)
                await session.commit()
                # Eagerly load labels
                await session.refresh(new_task, ['labels'])
                return new_task
            except Exception as e:
                await session.rollback()
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    async def get_tasks(self, user_id: int) -> List[Task]:
        async with self.db_session as session:
            try:
                result = await session.execute(
                    select(Task)
                    .where(Task.user_id == user_id)
                    .options(selectinload(Task.labels))
                )
                tasks = result.scalars().all()
                for task in tasks:
                    task.due_date = await self.convert_to_riyadh_TZ(task.due_date)
                    task.created_at = await self.convert_to_riyadh_TZ(task.created_at)
                    task.updated_at = await self.convert_to_riyadh_TZ(task.updated_at)
                return tasks
            except Exception as e:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    async def get_task(self, user_id: int, task_id: int) -> Task:
        async with self.db_session as session:
            try:
                result = await session.execute(
                    select(Task)
                    .where(Task.task_id == task_id, Task.user_id == user_id)
                    .options(selectinload(Task.labels))
                )
                task = result.scalars().first()
                if not task:
                    raise HTTPException(status_code=404, detail="Task not found")
                task.due_date = await self.convert_to_riyadh_TZ(task.due_date)
                task.created_at = await self.convert_to_riyadh_TZ(task.created_at)
                task.updated_at = await self.convert_to_riyadh_TZ(task.updated_at)

                return task
            except HTTPException as e:
                raise e
            except Exception as e:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    async def update_task(self, user_id: int, task_id: int, task_data: TaskUpdate) -> Task:
        async with self.db_session as session:
            try:
                # Fetch the task
                result = await session.execute(
                    select(Task)
                    .where(Task.task_id == task_id, Task.user_id == user_id)
                    .options(selectinload(Task.labels))
                )
                task = result.scalars().first()
                if not task:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

                # Update labels if provided
                if task_data.labels is not None:
                    label_result = await session.execute(
                        select(Label).where(
                            Label.label_id.in_(task_data.labels),
                            Label.user_id == user_id
                        )
                    )
                    labels = label_result.scalars().all()
                    if len(labels) != len(task_data.labels):
                        raise HTTPException(
                            status_code=400, detail="One or more labels not found or unauthorized"
                        )
                    task.labels = labels

                # Update other fields
                for key, value in task_data.model_dump(exclude_unset=True, exclude={"labels"}).items():
                    setattr(task, key, value)
                task.updated_at = datetime.now(self.timezone)

                await session.commit()
                # Eagerly load labels
                await session.refresh(task, ['labels'])
                return task
            except HTTPException as e:
                await session.rollback()
                raise e
            except Exception as e:
                await session.rollback()
                raise HTTPException(status_code=500, detail=str(e))

    async def delete_task(self, user_id: int, task_id: int):
        async with self.db_session as session:
            try:
                # Fetch the task
                result = await session.execute(
                    select(Task).where(Task.task_id == task_id, Task.user_id == user_id)
                )
                task = result.scalars().first()
                if not task:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

                await session.delete(task)
                await session.commit()
            except HTTPException as e:
                await session.rollback()
                raise e
            except Exception as e:
                await session.rollback()
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    async def mark_task_completed(self, user_id: int, task_id: int) -> Task:
        async with self.db_session as session:
            try:
                # Fetch the task
                result = await session.execute(
                    select(Task).where(Task.task_id == task_id, Task.user_id == user_id)
                )
                task = result.scalars().first()
                if not task:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

                task.is_completed = True
                task.updated_at = datetime.now(self.timezone)

                await session.commit()
                # Eagerly load labels
                await session.refresh(task, ['labels'])
                return task
            except HTTPException as e:
                await session.rollback()
                raise e
            except Exception as e:
                await session.rollback()
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))