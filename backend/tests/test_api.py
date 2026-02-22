import pytest
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from schemas import UserCreate, BoardCreate, ColumnCreate, CardCreate
import crud

def test_health(client):
    response = client.get("/api/hello")
    assert response.status_code == 200
    assert response.json() == {"message": "hello world"}

def test_users_boards_columns_cards(client, db):
    # Setup dummy user
    user = crud.create_user(db, UserCreate(username="testuser", password="pw"))
    
    # Verify User
    response = client.get("/api/users/testuser")
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
    user_id = response.json()["id"]

    # Create Board
    response = client.post("/api/boards", json={"title": "Test Board", "user_id": user_id})
    assert response.status_code == 200
    board_id = response.json()["id"]

    # Verify Board
    response = client.get(f"/api/users/{user_id}/boards")
    assert response.status_code == 200
    boards = response.json()
    assert len(boards) == 1
    assert boards[0]["title"] == "Test Board"

    # Create Column
    response = client.post("/api/columns", json={"title": "Col 1", "order": 0, "board_id": board_id})
    assert response.status_code == 200
    col_id = response.json()["id"]

    # Update Column
    response = client.patch(f"/api/columns/{col_id}", json={"title": "Col 1 Updated"})
    assert response.status_code == 200
    assert response.json()["title"] == "Col 1 Updated"

    # Create Card
    response = client.post("/api/cards", json={"title": "Task 1", "description": "Do this", "order": 0, "column_id": col_id})
    assert response.status_code == 200
    card_id = response.json()["id"]

    # Update Card
    response = client.patch(f"/api/cards/{card_id}", json={"description": "Updated description"})
    assert response.status_code == 200
    assert response.json()["description"] == "Updated description"

    # Test Deletion
    # Delete Card
    response = client.delete(f"/api/cards/{card_id}")
    assert response.status_code == 200

    # Verify Card gone
    response = client.patch(f"/api/cards/{card_id}", json={"title": "Should fail"})
    assert response.status_code == 404

    # Delete Column
    response = client.delete(f"/api/columns/{col_id}")
    assert response.status_code == 200

    # Verify Column gone
    response = client.patch(f"/api/columns/{col_id}", json={"title": "Should fail"})
    assert response.status_code == 404
