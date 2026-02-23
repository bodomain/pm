import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

async def ask_math_question(prompt: str = "What is 2+2?") -> str:
    response = await client.chat.completions.create(
        model="gpt-5-nano",
        messages=[{"role": "user", "content": prompt}],
    )
    
    return response.choices[0].message.content or ""
import json
from pydantic import BaseModel, Field

class BoardOperation(BaseModel):
    action: str = Field(description="The action: add_card, update_card, delete_card")
    title: str | None = Field(default=None, description="Title of the card to add or update")
    description: str | None = Field(default=None, description="Description of the card")
    column_name: str | None = Field(default=None, description="Name of the column where the card belongs")
    card_id: int | None = Field(default=None, description="ID of the card to update or delete")

class AIResponse(BaseModel):
    response_message: str = Field(description="The natural language response to the user")
    operations: list[BoardOperation] = Field(description="List of operations to apply to the Kanban board")

async def process_chat(user_message: str, board_data: dict) -> AIResponse:
    prompt = f"""You are a helpful Kanban board assistant.
Here is the current board state in JSON format:
{json.dumps(board_data, indent=2)}

The user says: "{user_message}"

Determine if any operations need to be performed on the board. Respond with a helpful message and the required operations. 
Only use column_name if you need to add to it, or card_id if you want to modify/delete it.
"""
    
    response = await client.beta.chat.completions.parse(
        model="gpt-5-nano",
        messages=[
            {"role": "system", "content": "You are a helpful Kanban assistant."},
            {"role": "user", "content": prompt}
        ],
        response_format=AIResponse
    )
    
    return response.choices[0].message.parsed
