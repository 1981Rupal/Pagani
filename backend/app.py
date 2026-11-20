from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.index import router as index_router
app = FastAPI(
    title = "Pagani API",
    description = "This is the API for Pagani, a platform for managing and tracking projects.",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    prefix="/api",
    tags=["API"],
    router=index_router
)