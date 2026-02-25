from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from typing import Optional
import os
import jwt
from datetime import datetime, timedelta

import models, schemas, crud
from database import engine, get_db, SessionLocal

# Create all tables (database initialization script logic)
models.Base.metadata.create_all(bind=engine)

security = HTTPBearer()

def get_current_user(request: Request, token: str = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token.credentials)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    return int(user_id)

@asynccontextmanager
def lifespan(app: FastAPI):
    # Startup: Initialize dummy DB data if needed
    db = SessionLocal()
    setup_dummy_data(db)
    db.close()
    yield
    # Shutdown

app = FastAPI(title="Kanban Board API", lifespan=lifespan)

@app.middleware("http")
async def add_cors_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.JWTError:
        return None

def setup_dummy_data(db: Session):
    user = crud.get_user_by_username(db, "user")
    if not user:
        user = crud.create_user(db, schemas.UserCreate(username="user", password="password"))
        board = crud.create_board(db, schemas.BoardCreate(title="Default Board", user_id=user.id))
        c1 = crud.create_column(db, schemas.ColumnCreate(title="Backlog", order=0, board_id=board.id))
        c2 = crud.create_column(db, schemas.ColumnCreate(title="Discovery", order=1, board_id=board.id))
        c3 = crud.create_column(db, schemas.ColumnCreate(title="In Progress", order=2, board_id=board.id))
        c4 = crud.create_column(db, schemas.ColumnCreate(title="Review", order=3, board_id=board.id))
        c5 = crud.create_column(db, schemas.ColumnCreate(title="Done", order=4, board_id=board.id))

        crud.create_card(db, schemas.CardCreate(title="Align roadmap themes", description="Draft quarterly themes with impact statements and metrics.", order=0, column_id=c1.id))
        crud.create_card(db, schemas.CardCreate(title="Gather customer signals", description="Review support tags, sales notes, and churn feedback.", order=1, column_id=c1.id))
        crud.create_card(db, schemas.CardCreate(title="Prototype analytics view", description="Sketch initial dashboard layout and key drill-downs.", order=0, column_id=c2.id))
        crud.create_card(db, schemas.CardCreate(title="Refine status language", description="Standardize column labels and tone across the board.", order=0, column_id=c3.id))
        crud.create_card(db, schemas.CardCreate(title="Design card layout", description="Add hierarchy and spacing for scanning dense lists.", order=1, column_id=c3.id))
        crud.create_card(db, schemas.CardCreate(title="QA micro-interactions", description="Verify hover, focus, and loading states.", order=0, column_id=c4.id))
        crud.create_card(db, schemas.CardCreate(title="Ship marketing page", description="Final copy approved and asset pack delivered.", order=0, column_id=c5.id))
        crud.create_card(db, schemas.CardCreate(title="Close onboarding sprint", description="Document release notes and share internally.", order=1, column_id=c5.id))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize dummy DB data if needed
    db = SessionLocal()
    setup_dummy_data(db)
    db.close()
    yield
    # Shutdown

app = FastAPI(title="Kanban Board API", lifespan=lifespan)

@app.post("/api/auth/login", response_model=schemas.AuthResponse)
async def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, request.username, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

@app.post("/api/auth/register", response_model=schemas.AuthResponse)
async def register(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_username(db, request.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    user_create = schemas.UserCreate(username=request.username, password=request.password)
    user = crud.create_user(db, user_create)

    # Initialize a default board for the newly registered user
    board = crud.create_board(db, schemas.BoardCreate(title="Default Board", user_id=user.id))
    crud.create_column(db, schemas.ColumnCreate(title="To Do", order=0, board_id=board.id))
    crud.create_column(db, schemas.ColumnCreate(title="In Progress", order=1, board_id=board.id))
    crud.create_column(db, schemas.ColumnCreate(title="Done", order=2, board_id=board.id))

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

@app.get("/api/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

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
def read_user_boards(user_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user)):
    if current_user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    boards = crud.get_boards(db, user_id=user_id)
    return boards

@app.post("/api/boards", response_model=schemas.Board)
def create_board(board: schemas.BoardCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user)):
    board.user_id = current_user_id
    return crud.create_board(db=db, board=board)

@app.post("/api/columns", response_model=schemas.Column)
def create_column(column: schemas.ColumnCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user)):
    # Verify user owns the board
    boards = crud.get_boards(db, user_id=current_user_id)
    board_ids = [b.id for b in boards]
    if column.board_id not in board_ids:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.create_column(db=db, column=column)

@app.patch("/api/columns/{column_id}", response_model=schemas.Column)
def update_column(column_id: int, column: schemas.ColumnUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user)):
    # Verify user owns the column's board
    db_column = db.query(models.Column).filter(models.Column.id == column_id).first()
    if not db_column:
        raise HTTPException(status_code=404, detail="Column not found")

    boards = crud.get_boards(db, user_id=current_user_id)
    board_ids = [b.id for b in boards]
    if db_column.board_id not in board_ids:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_column = crud.update_column(db, column_id, column)
    if not db_column:
        raise HTTPException(status_code=404, detail="Column not found")
    return db_column

@app.delete("/api/columns/{column_id}")
def delete_column(column_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user)):
    # Verify user owns the column's board
    db_column = db.query(models.Column).filter(models.Column.id == column_id).first()
    if not db_column:
        raise HTTPException(status_code=404, detail="Column not found")

    boards = crud.get_boards(db, user_id=current_user_id)
    board_ids = [b.id for b in boards]
    if db_column.board_id not in board_ids:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_column = crud.delete_column(db, column_id)
    if not db_column:
        raise HTTPException(status_code=404, detail="Column not found")
    return {"message": "deleted"}

@app.post("/api/cards", response_model=schemas.Card)
def create_card(card: schemas.CardCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user)):
    # Verify user owns the column's board
    db_column = db.query(models.Column).filter(models.Column.id == card.column_id).first()
    if not db_column:
        raise HTTPException(status_code=404, detail="Column not found")

    boards = crud.get_boards(db, user_id=current_user_id)
    board_ids = [b.id for b in boards]
    if db_column.board_id not in board_ids:
        raise HTTPException(status_code=403, detail="Not authorized")

    return crud.create_card(db=db, card=card)

@app.patch("/api/cards/{card_id}", response_model=schemas.Card)
def update_card(card_id: int, card: schemas.CardUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user)):
    # Verify user owns the card's board
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")

    db_column = db.query(models.Column).filter(models.Column.id == db_card.column_id).first()
    if not db_column:
        raise HTTPException(status_code=404, detail="Column not found")

    boards = crud.get_boards(db, user_id=current_user_id)
    board_ids = [b.id for b in boards]
    if db_column.board_id not in board_ids:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_card = crud.update_card(db, card_id, card)
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    return db_card

@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user)):
    # Verify user owns the card's board
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")

    db_column = db.query(models.Column).filter(models.Column.id == db_card.column_id).first()
    if not db_column:
        raise HTTPException(status_code=404, detail="Column not found")

    boards = crud.get_boards(db, user_id=current_user_id)
    board_ids = [b.id for b in boards]
    if db_column.board_id not in board_ids:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_card = crud.delete_card(db, card_id)
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "deleted"}

from ai_service import ask_math_question, process_chat
from pydantic import BaseModel

@app.get("/api/ai/test")
async def test_ai():
    try:
        response = await ask_math_question("What is 2+2?")
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    message: str
    user_id: int

@app.post("/api/ai/chat")
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user)):
    if current_user_id != request.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        boards = crud.get_boards(db, user_id=request.user_id)
        if not boards:
            raise HTTPException(status_code=404, detail="No board found")

        board = boards[0]
        board_data = {
            "board_title": board.title,
            "columns": [
                {
                    "id": col.id,
                    "title": col.title,
                    "cards": [
                        {"id": card.id, "title": card.title, "description": card.description}
                        for card in col.cards
                    ]
                }
                for col in board.columns
            ]
        }

        ai_response = await process_chat(request.message, board_data)

        for op in ai_response.operations:
            if op.action == "add_card":
                col = next((c for c in board.columns if c.title.lower() == op.column_name.lower()), None) if op.column_name else None
                if not col and board.columns: col = board.columns[0]
                if col:
                    crud.create_card(db, schemas.CardCreate(
                        title=op.title or "New Card",
                        description=op.description or "",
                        order=len(col.cards),
                        column_id=col.id
                    ))
            elif op.action == "delete_card" and op.card_id:
                crud.delete_card(db, op.card_id)
            elif op.action == "update_card" and op.card_id:
                update_data = {}
                if op.title is not None: update_data["title"] = op.title
                if op.description is not None: update_data["description"] = op.description
                if update_data:
                    crud.update_card(db, op.card_id, schemas.CardUpdate(**update_data))

        db.refresh(board)
        updated_boards = crud.get_boards(db, user_id=request.user_id)

        return {
            "response_message": ai_response.response_message,
            "board": schemas.Board.model_validate(updated_boards[0]).model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
