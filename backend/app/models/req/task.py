## utils 
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

## dependencies
from models.common.task import PriorityLevel, TaskBase, LabelBase


class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=1000)
    due_date: Optional[datetime] = None  # Required if updating
    is_completed: Optional[bool] = None
    priority: Optional[PriorityLevel] = None
    labels: Optional[List[int]] = None

class LabelCreate(LabelBase):
    pass

class LabelUpdate(LabelBase):
    pass