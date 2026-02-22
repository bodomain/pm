# Database Design (SQLite & SQLAlchemy)

## Overview
This document details the database architecture for the Kanban application. We will use SQLite for local development and simplicity, mapped using SQLAlchemy as our ORM within the FastAPI backend.

## Schema Details

We will define four main entities: **User**, **Board**, **Column**, and **Card**.

### 1. `users` Table
Stores user credentials and details.
- `id`: Integer, Primary Key
- `username`: String(50), Unique, Not Null
- `password_hash`: String(255), Not Null

### 2. `boards` Table
Represents a Kanban board belonging to a user.
- `id`: Integer, Primary Key
- `title`: String(100), Not Null
- `user_id`: Integer, Foreign Key (`users.id`), Not Null

### 3. `columns` Table
Represents a status column within a board (e.g., "To Do", "In Progress", "Done").
- `id`: Integer, Primary Key
- `title`: String(50), Not Null
- `order`: Integer, Not Null (For ordering columns left-to-right)
- `board_id`: Integer, Foreign Key (`boards.id`), Not Null

### 4. `cards` Table
Represents a task or item existing within a specific column.
- `id`: Integer, Primary Key
- `title`: String(200), Not Null
- `description`: Text, Nullable
- `order`: Integer, Not Null (For ordering cards top-to-bottom within a column)
- `column_id`: Integer, Foreign Key (`columns.id`), Not Null

---

## SQLAlchemy Models Representation

```python
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    boards = relationship("Board", back_populates="owner", cascade="all, delete-orphan")

class Board(Base):
    __tablename__ = 'boards'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    owner = relationship("User", back_populates="boards")
    columns = relationship("Column", back_populates="board", cascade="all, delete-orphan", order_by="Column.order")

class Column(Base):
    __tablename__ = 'columns'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(50), nullable=False)
    order = Column(Integer, nullable=False, default=0)
    board_id = Column(Integer, ForeignKey('boards.id'), nullable=False)
    
    board = relationship("Board", back_populates="columns")
    cards = relationship("Card", back_populates="column", cascade="all, delete-orphan", order_by="Card.order")

class Card(Base):
    __tablename__ = 'cards'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False, default=0)
    column_id = Column(Integer, ForeignKey('columns.id'), nullable=False)
    
    column = relationship("Column", back_populates="cards")
```

## Relationships
- A **User** has a one-to-many relationship with **Boards**.
- A **Board** has a one-to-many relationship with **Columns**.
- A **Column** has a one-to-many relationship with **Cards**.
- Cascading deletes are configured: deleting a board deletes its columns and cards.
