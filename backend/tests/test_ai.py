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
