from sqlalchemy import Column,Table, String, Integer, Date, ForeignKey, Text,TIMESTAMP, DateTime, func,Boolean,Enum as SqlEnum
from sqlalchemy.orm import relationship, DeclarativeBase, Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncAttrs
from typing import List
from datetime import datetime
from enum import Enum

class Base (AsyncAttrs,DeclarativeBase):
    pass

class PriorityLevel(Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class User(Base):
    __tablename__ = 'users'

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    google_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


    tasks: Mapped[list["Task"]] = relationship(
        "Task", back_populates="user", cascade="all, delete-orphan"
    )
    labels: Mapped[list["Label"]] = relationship(
        "Label", back_populates="user", cascade="all, delete-orphan"
    )

## Association Table to handle many-to-many relationship
task_labels = Table(
    'task_labels',
    Base.metadata,
    Column('task_id', ForeignKey('tasks.task_id'), primary_key=True),
    Column('label_id', ForeignKey('labels.label_id'), primary_key=True)
)

class Task(Base):
    __tablename__ = 'tasks'

    task_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    due_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[PriorityLevel | None] = mapped_column(
    SqlEnum(
        PriorityLevel,
        name="prioritylevel",
        values_callable=lambda obj: [e.value for e in obj],
        create_type=True,
    ),
    default=None,
    nullable=True,
)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.user_id'))
    user: Mapped["User"] = relationship("User", back_populates="tasks")
    labels: Mapped[list["Label"]] = relationship(
        "Label", secondary=task_labels, back_populates="tasks"
    )

class Label(Base):
    __tablename__ = 'labels'

    label_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # Optional HEX color code

    # Relationships
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.user_id'))
    user: Mapped["User"] = relationship("User", back_populates="labels")
    tasks: Mapped[list["Task"]] = relationship(
        "Task", secondary=task_labels, back_populates="labels"
    )