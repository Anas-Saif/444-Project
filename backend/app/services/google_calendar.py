# services/google_calendar_service.py

import json
from datetime import timedelta
from typing import Optional
from os import getenv

from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.schema import Task, User

class GoogleCalendarService:
    def __init__(self):
        self.client_config = {
            "web": {
                "client_id": getenv("GOOGLE_CLIENT_ID"),
                "client_secret": getenv("GOOGLE_CLIENT_SECRET"),
                "redirect_uris": [getenv("GOOGLE_REDIRECT_URI")],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }
        self.scopes = ['https://www.googleapis.com/auth/calendar']

    async def get_authorization_url(self, state: Optional[str] = None) -> str:
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.scopes,
            state=state
        )
        flow.redirect_uri = getenv("GOOGLE_REDIRECT_URI")

        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        return authorization_url

    async def fetch_and_store_credentials(self, session: AsyncSession, user_id: int, code: str, state: Optional[str] = None):
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.scopes,
            state=state
        )
        flow.redirect_uri = getenv("GOOGLE_REDIRECT_URI")

        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Serialize credentials
        creds_data = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
        }

        try:
            user = await self.get_user(session, user_id)
            user.google_token = json.dumps(creds_data)
            await session.commit()
            # Perform initial synchronization
            await self.initial_sync(session, user)
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    async def initial_sync(self, session: AsyncSession, user: User):
        tasks = await self._get_user_tasks(session, user.user_id)
        for task in tasks:
            await self.sync_task_with_google_calendar(session, task, user, action='create')

    async def sync_task_with_google_calendar(self, session: AsyncSession, task: Task, user: User, action: str):
        if not user.google_token:
            return  # User is not synced with Google Calendar

        # Load credentials
        creds_data = json.loads(user.google_token)
        credentials = Credentials(
            token=creds_data['token'],
            refresh_token=creds_data.get('refresh_token'),
            token_uri=creds_data['token_uri'],
            client_id=creds_data['client_id'],
            client_secret=creds_data['client_secret'],
            scopes=creds_data['scopes'],
        )

        # Refresh token if needed
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

            # Update stored credentials
            creds_data['token'] = credentials.token
            creds_data['refresh_token'] = credentials.refresh_token
            user.google_token = json.dumps(creds_data)
            await session.commit()

        service = build('calendar', 'v3', credentials=credentials)

        if action == 'create':
            event_body = self.build_event_body(task)
            event = service.events().insert(calendarId='primary', body=event_body).execute()
            task.google_event_id = event['id']
        elif action == 'update':
            if not task.google_event_id:
                # Event does not exist, create it
                await self.sync_task_with_google_calendar(session, task, user, 'create')
                return
            event_body = self.build_event_body(task)
            service.events().update(
                calendarId='primary',
                eventId=task.google_event_id,
                body=event_body
            ).execute()
        elif action == 'delete':
            if task.google_event_id:
                service.events().delete(calendarId='primary', eventId=task.google_event_id).execute()
                task.google_event_id = None

        # No need to add the task to the session; it's already attached
        # Changes will be committed when the session commits

    def build_event_body(self, task: Task) -> dict:
        event_body = {
            'summary': task.title,
            'description': task.description or '',
            'start': {
                'dateTime': task.due_date.isoformat(),
                'timeZone': 'Asia/Riyadh',
            },
            'end': {
                'dateTime': (task.due_date + timedelta(hours=1)).isoformat(),
                'timeZone': 'Asia/Riyadh',
            },
        }
        return event_body

    async def get_user(self, session: AsyncSession, user_id: int) -> User:
        result = await session.execute(
            select(User).where(User.user_id == user_id)
        )
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    async def _get_user_tasks(self, session: AsyncSession, user_id: int) -> list[Task]:
        result = await session.execute(
            select(Task).where(Task.user_id == user_id)
        )
        tasks = result.scalars().all()
        return tasks