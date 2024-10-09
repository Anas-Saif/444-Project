## utils
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from fastapi import HTTPException, status
## dependency
from db.schema import Label
from db.db_engine import DB_session
## models
from models.req.task import LabelCreate,LabelUpdate


class LabelService:
    def __init__(self):
        self.db_session = DB_session()

    async def create_label(self, user_id: int, label_data: LabelCreate) -> Label:
        async with self.db_session as session:
            try:
                new_label = Label(
                    name=label_data.name,
                    color=label_data.color,
                    user_id=user_id
                )
                session.add(new_label)
                await session.commit()
                await session.refresh(new_label)
                return new_label
            except Exception as e:
                await session.rollback()
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    async def get_labels(self, user_id: int) -> List[Label]:
        async with self.db_session as session:
            try:
                result = await session.execute(
                    select(Label).where(Label.user_id == user_id)
                )
                labels = result.scalars().all()
                return labels
            except Exception as e:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    async def get_label(self, user_id: int, label_id: int) -> Label:
        async with self.db_session as session:
            try:
                result = await session.execute(
                    select(Label).where(Label.label_id == label_id, Label.user_id == user_id)
                )
                label = result.scalars().first()
                if not label:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")
                return label
            except HTTPException as e:
                raise e
            except Exception as e:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    async def update_label(self, user_id: int, label_id: int, label_data: LabelUpdate) -> Label:
        async with self.db_session as session:
            try:
                # Fetch the label
                result = await session.execute(
                    select(Label).where(Label.label_id == label_id, Label.user_id == user_id)
                )
                label = result.scalars().first()
                if not label:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")

                for key, value in label_data.model_dump(exclude_unset=True).items():
                    setattr(label, key, value)

                await session.commit()
                await session.refresh(label)
                return label
            except HTTPException as e:
                await session.rollback()
                raise e
            except Exception as e:
                await session.rollback()
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    async def delete_label(self, user_id: int, label_id: int):
        async with self.db_session as session:
            try:
                # Fetch the label
                result = await session.execute(
                    select(Label).where(Label.label_id == label_id, Label.user_id == user_id)
                )
                label = result.scalars().first()
                if not label:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")

                await session.delete(label)
                await session.commit()
            except HTTPException as e:
                await session.rollback()
                raise e
            except Exception as e:
                await session.rollback()
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))