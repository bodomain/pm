from sqlalchemy.orm import Session
import models, schemas
import bcrypt
from typing import Optional

# Users
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = hash_password(user.password)
    db_user = models.User(username=user.username, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user

# Boards
def get_boards(db: Session, user_id: int):
    return db.query(models.Board).filter(models.Board.user_id == user_id).all()

def create_board(db: Session, board: schemas.BoardCreate):
    db_board = models.Board(title=board.title, user_id=board.user_id)
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    return db_board

# Columns
def create_column(db: Session, column: schemas.ColumnCreate):
    db_column = models.Column(title=column.title, order=column.order, board_id=column.board_id)
    db.add(db_column)
    db.commit()
    db.refresh(db_column)
    return db_column

def update_column(db: Session, column_id: int, column_update: schemas.ColumnUpdate):
    db_column = db.query(models.Column).filter(models.Column.id == column_id).first()
    if db_column:
        for key, value in column_update.model_dump(exclude_unset=True).items():
            setattr(db_column, key, value)
        db.commit()
        db.refresh(db_column)
    return db_column

def delete_column(db: Session, column_id: int):
    db_column = db.query(models.Column).filter(models.Column.id == column_id).first()
    if db_column:
        db.delete(db_column)
        db.commit()
    return db_column

# Cards
def create_card(db: Session, card: schemas.CardCreate):
    db_card = models.Card(title=card.title, description=card.description, order=card.order, column_id=card.column_id)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

def update_card(db: Session, card_id: int, card_update: schemas.CardUpdate):
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if db_card:
        for key, value in card_update.model_dump(exclude_unset=True).items():
            setattr(db_card, key, value)
        db.commit()
        db.refresh(db_card)
    return db_card

def delete_card(db: Session, card_id: int):
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if db_card:
        db.delete(db_card)
        db.commit()
    return db_card
