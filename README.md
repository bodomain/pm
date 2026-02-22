# Kanban Studio

**Kanban Studio** is a modern, AI-powered project management tool built with Next.js and FastAPI. It provides a seamless Kanban board experience with intelligent assistance to help you organize tasks, track progress, and boost productivity.

## Features

- **Modern Kanban Board**: Intuitive drag-and-drop interface to manage your workflow
- **AI-Powered Assistance**: Get intelligent suggestions and task management help from AI
- **User Authentication**: Secure login system with dummy credentials
- **Persistent Storage**: All your boards and tasks are saved automatically
- **Dockerized**: Easy deployment with Docker and Docker Compose

## Tech Stack

- **Frontend**: Next.js (React), TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), Uvicorn
- **Database**: SQLite (via SQLAlchemy)
- **AI Integration**: OpenAI API (gpt-5-nano)
- **Containerization**: Docker, Docker Compose

## Project Structure

```
pm/
├── backend/          # FastAPI backend application
│   ├── api/          # API routes and endpoints
│   ├── models/       # SQLAlchemy database models
│   ├── services/     # AI and business logic
│   └── main.py       # FastAPI application entry point
├── frontend/         # Next.js frontend application
│   ├── app/          # Next.js pages and components
│   ├── components/   # Reusable React components
│   └── lib/          # Utility functions and helpers
├── scripts/          # Utility scripts (start, stop, etc.)
├── .env              # Environment variables (not in git)
├── docker-compose.yml  # Docker Compose configuration
└── Dockerfile        # Dockerfile for the application
```

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed
- [Git](https://git-scm.com/) installed

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pm
   ```

2. **Start the application**
   ```bash
   ./scripts/start.sh
   ```

   This will:
   - Build the Docker images
   - Start the backend and frontend
   - Create the database automatically

3. **Access the application**
   - Open [http://localhost:8000](http://localhost:8000) in your browser
   - Login with username: `user` and password: `password`

### Stopping the application

```bash
./scripts/stop.sh
```

## Authentication

For development purposes, we use dummy credentials:

- **Username**: `user`
- **Password**: `password`

## AI Integration

The application uses OpenAI's GPT-5 Nano model for AI-powered features. To enable AI functionality, you need to set your OpenAI API key in the `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Testing

### Run frontend tests
```bash
cd frontend
npm run test:all
```

### Run backend tests
```bash
cd backend
pytest
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
