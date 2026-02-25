import pytest
import sys
import os
from unittest.mock import AsyncMock, patch

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.mark.asyncio
async def test_ai_test_endpoint(client):
    # Mock the openai call
    with patch('main.ask_math_question', new_callable=AsyncMock) as mock_ask:
        mock_ask.return_value = "4"
        
        response = client.get("/api/ai/test")
        assert response.status_code == 200
        assert "4" in response.json()["response"]
        
        mock_ask.assert_called_once_with("What is 2+2?")

@pytest.mark.asyncio
async def test_ai_chat_endpoint(client, db):
    from schemas import UserCreate, BoardCreate, ColumnCreate
    import crud
    
    # Setup dummy data for test
    user = crud.create_user(db, UserCreate(username="aiuser", password="pw"))
    board = crud.create_board(db, BoardCreate(title="Test Board", user_id=user.id))
    col = crud.create_column(db, ColumnCreate(title="To Do", order=0, board_id=board.id))
    
    from ai_service import AIResponse, BoardOperation
    
    mock_ai_response = AIResponse(
        response_message="I have added the card for you.",
        operations=[
            BoardOperation(action="add_card", title="New Task via AI", description="A cool task", column_name="To Do")
        ]
    )
    
    with patch('main.process_chat', new_callable=AsyncMock) as mock_process:
        mock_process.return_value = mock_ai_response
        
        # Login to get token
        login_response = client.post("/api/auth/login", json={"username": "aiuser", "password": "pw"})
        token = login_response.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

        response = client.post("/api/ai/chat", json={"message": "Add a new task", "user_id": user.id})
        
        assert response.status_code == 200
        json_data = response.json()
        assert json_data["response_message"] == "I have added the card for you."
        
        # Verify db operation was applied
        board_data = json_data["board"]
        assert len(board_data["columns"]) == 1
        assert len(board_data["columns"][0]["cards"]) == 1
        assert board_data["columns"][0]["cards"][0]["title"] == "New Task via AI"
        
        mock_process.assert_called_once()
