from typing import Optional
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class CardBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: Optional[int] = 0

class CardCreate(CardBase):
    column_id: int

class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    column_id: Optional[int] = None

class Card(CardBase):
    id: int
    column_id: int
    model_config = ConfigDict(from_attributes=True)

class ColumnBase(BaseModel):
    title: str
    order: Optional[int] = 0

class ColumnCreate(ColumnBase):
    board_id: int

class ColumnUpdate(BaseModel):
    title: Optional[str] = None
    order: Optional[int] = None

class Column(ColumnBase):
    id: int
    board_id: int
    cards: List[Card] = []
    model_config = ConfigDict(from_attributes=True)

class BoardBase(BaseModel):
    title: str

class BoardCreate(BoardBase):
    user_id: int

class Board(BoardBase):
    id: int
    user_id: int
    columns: List[Column] = []
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    boards: List[Board] = []
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int