# Browser Memory Inspector - Backend

Simple Express.js server for serving the Browser Memory Inspector frontend and providing API endpoints.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from template:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

Or start in production:
```bash
npm start
```

The server will run on `http://localhost:5000` (or the port specified in `.env`)

## Project Structure

```
Backend/
├── server.js          # Express server entry point
├── package.json       # Dependencies
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## API Endpoints

### Health Check
- **GET** `/api/health` - Check server status
  - Response: `{ status: 'ok', message: '...' }`

## Features

- CORS enabled for cross-origin requests
- Static file serving for frontend
- JSON middleware for request/response handling
- Error handling middleware
- Environment variable support

## Development

### Available Scripts

- `npm start` - Start server with Node.js
- `npm run dev` - Start server with watch mode (using `--watch` flag)

## Environment Variables

| Variable | Default | Description |
| -------- | ------- | ----------- |
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment mode |

## License

MIT
