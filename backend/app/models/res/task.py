## utils
from pydantic import BaseModel,ConfigDict, field_serializer
from datetime import datetime
from typing import Optional, List

## dependencies
from models.common.task import PriorityLevel,LabelBase,convert_to_riyadh

class LabelOut(BaseModel):
    label_id: int
    name: str
    color: Optional[str] = None

    class Config:
        orm_mode = True

class TaskOut(BaseModel):
    task_id: int
    google_event_id: Optional[str]
    title: str
    description: Optional[str]
    due_date: datetime
    is_completed: bool
    priority: Optional[PriorityLevel]
    created_at: datetime
    updated_at: datetime
    labels: Optional[List[LabelOut]] = None

    model_config = ConfigDict(from_attributes=True)
    model_config['from_attributes']=True

    @field_serializer('due_date', 'created_at', 'updated_at')
    def serialize_datetime(self, dt: datetime) -> str:
        dt_riyadh = convert_to_riyadh(dt)
        # Format datetime as string
        return dt_riyadh.isoformat()

class LabelOut(LabelBase):
    label_id: int

    class Config:
        orm_mode = True