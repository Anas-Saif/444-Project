## utils
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
## routers
from routers.base import router as base_router
from routers.user import router as user_router
from routers.tasks import router as task_router
from routers.labels import router as label_router
from routers.Google_auth import router as google_auth_router
## db
from db.db_engine import create_db

app = FastAPI(title="Student Pilot",
              description="This API provides the main functions of Student Pilot as a service",
              version="1.1.0",
              docs_url="/docs",
              )
app.add_middleware(CORSMiddleware,
                    allow_origins=["*"],
                    allow_credentials=True,
                    allow_methods=["*"],
                    allow_headers=["*"])
app.include_router(base_router)
app.include_router(user_router)
app.include_router(task_router)
app.include_router(label_router)
app.include_router(google_auth_router)

app.add_event_handler("startup", create_db)
if __name__ == "__main__":
    uvicorn.run(app=app,port=8000,reload=True,log_level="info")