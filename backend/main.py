from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os

app = FastAPI(title="Kanban Board API")

# Health check / hello world API route
@app.get("/api/hello")
def read_hello():
    return {"message": "hello world"}

# Mount the static directory to serve the frontend or holding page
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Make sure the directory exists (it might not structurely exist yet before a frontend build)
os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
