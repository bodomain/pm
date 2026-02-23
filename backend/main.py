from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import os

import models, schemas, crud
from database import engine, get_db, SessionLocal

# Create all tables (database initialization script logic)
models.Base.metadata.create_all(bind=engine)

def setup_dummy_data(db: Session):
    user = crud.get_user_by_username(db, "user")
    if not user:
        user = crud.create_user(db, schemas.UserCreate(username="user", password="password"))
        board = crud.create_board(db, schemas.BoardCreate(title="Default Board", user_id=user.id))
        c1 = crud.create_column(db, schemas.ColumnCreate(title="To Do", order=0, board_id=board.id))
        c2 = crud.create_column(db, schemas.ColumnCreate(title="In Progress", order=1, board_id=board.id))
        c3 = crud.create_column(db, schemas.ColumnCreate(title="Done", order=2, board_id=board.id))
        crud.create_card(db, schemas.CardCreate(title="Learn FastAPI", description="Read the docs", order=0, column_id=c1.id))
        crud.create_card(db, schemas.CardCreate(title="Setup DB", description="SQLite stuff", order=1, column_id=c1.id))
        crud.create_card(db, schemas.CardCreate(title="Design Frontend", description="React / Next.js", order=0, column_id=c2.id))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize dummy DB data if needed
    db = SessionLocal()
    setup_dummy_data(db)
    db.close()
    yield
    # Shutdown

app = FastAPI(title="Kanban Board API", lifespan=lifespan)

@app.get("/api/hello")
def read_hello():
    return {"message": "hello world"}

@app.get("/api/users/{username}", response_model=schemas.User)
def read_user(username: str, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=username)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.get("/api/users/{user_id}/boards", response_model=list[schemas.Board])
def read_user_boards(user_id: int, db: Session = Depends(get_db)):
    boards = crud.get_boards(db, user_id=user_id)
    return boards

@app.post("/api/boards", response_model=schemas.Board)
def create_board(board: schemas.BoardCreate, db: Session = Depends(get_db)):
    return crud.create_board(db=db, board=board)

@app.post("/api/columns", response_model=schemas.Column)
def create_column(column: schemas.ColumnCreate, db: Session = Depends(get_db)):
    return crud.create_column(db=db, column=column)

@app.patch("/api/columns/{column_id}", response_model=schemas.Column)
def update_column(column_id: int, column: schemas.ColumnUpdate, db: Session = Depends(get_db)):
    db_column = crud.update_column(db, column_id, column)
    if not db_column:
        raise HTTPException(status_code=404, detail="Column not found")
    return db_column

@app.delete("/api/columns/{column_id}")
def delete_column(column_id: int, db: Session = Depends(get_db)):
    db_column = crud.delete_column(db, column_id)
    if not db_column:
        raise HTTPException(status_code=404, detail="Column not found")
    return {"message": "deleted"}

@app.post("/api/cards", response_model=schemas.Card)
def create_card(card: schemas.CardCreate, db: Session = Depends(get_db)):
    return crud.create_card(db=db, card=card)

@app.patch("/api/cards/{card_id}", response_model=schemas.Card)
def update_card(card_id: int, card: schemas.CardUpdate, db: Session = Depends(get_db)):
    db_card = crud.update_card(db, card_id, card)
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    return db_card

@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    db_card = crud.delete_card(db, card_id)
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "deleted"}

from ai_service import ask_math_question

@app.get("/api/ai/test")
async def test_ai():
    try:
        response = await ask_math_question("What is 2+2?")
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
