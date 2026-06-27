import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import routers
from backend.routers import auth, incidents, memory, reports
from backend.database.db import test_db_connection

# Load env configurations
load_dotenv()

app = FastAPI(
    title="AI Incident Response Agent API",
    description="Backend API featuring Hindsight persistent memory and cascadeflow runtime routing.",
    version="1.0.0"
)

# Set CORS origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*" # Dynamic fallback for other environments
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup verification
@app.on_event("startup")
async def startup_event():
    print("Starting AI Incident Response Agent backend...")
    await test_db_connection()
    from backend.memory.hindsight import init_hindsight
    await init_hindsight()

# Include routes
app.include_router(auth.router)
app.include_router(incidents.router)
app.include_router(memory.router)
app.include_router(reports.router)

@app.get("/")
def read_root():
    from backend.memory.hindsight import hindsight_healthy
    return {
        "status": "online",
        "service": "AI Incident Response Agent API",
        "hindsight": "active" if hindsight_healthy else "degraded",
        "cascadeflow": "active"
    }

@app.get("/health")
def health_check():
    from backend.memory.hindsight import hindsight_healthy, HINDSIGHT_BASE_URL, HINDSIGHT_BANK_ID
    from backend.database.db import use_mongodb
    return {
        "status": "healthy" if hindsight_healthy else "degraded",
        "database": "connected" if use_mongodb else "offline_fallback",
        "hindsight": {
            "status": "connected" if hindsight_healthy else "offline_fallback",
            "base_url": HINDSIGHT_BASE_URL,
            "bank_id": HINDSIGHT_BANK_ID
        },
        "cascadeflow": "active"
    }

if __name__ == "__main__":
    import uvicorn
    # Read port/host parameters from env
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
