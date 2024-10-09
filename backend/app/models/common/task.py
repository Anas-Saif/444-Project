## utils 
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime
from typing import Optional, List
import pytz


def convert_to_riyadh(dt: datetime) -> datetime:
    RIYADH_TZ = pytz.timezone('Asia/Riyadh')
    if dt.tzinfo is None:
        # Assume UTC if no time zone is provided
        dt = dt.replace(tzinfo=pytz.utc)
    return dt.astimezone(RIYADH_TZ)

class PriorityLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class TaskBase(BaseModel):
    title: str = Field(..., max_length=500)
    description: Optional[str] = Field(None, max_length=1000)
    due_date: datetime  # Mandatory
    is_completed: bool = False
    priority: Optional[PriorityLevel] = None
    labels: Optional[List[int]] = None  # List of label IDs

class LabelBase(BaseModel):
    name: str = Field(..., max_length=50)
    color: Optional[str] = Field(None, max_length=7, pattern='^#([A-Fa-f0-9]{6})$')  # Optional HEX color code