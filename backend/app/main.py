## utils
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
## routers
from routers.base import router as base_router

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

if __name__ == "__main__":
    uvicorn.run(app=app,port=8000,reload=True,log_level="info")