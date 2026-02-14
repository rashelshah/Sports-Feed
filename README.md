# Sports Feed

## Project Overview
Sports Feed is a web application designed to provide users with real-time updates, scores, and news from various sports around the world. The goal is to keep sports enthusiasts engaged with live data and tailored content.

## Tech Stack
- **Frontend:** React, Redux, Bootstrap
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **APIs:** RESTful APIs, WebSocket for real-time data

## Installation Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/rashelshah/Sports-Feed.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Sports-Feed
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up the environment variables:
   ```bash
   touch .env
   ```
   Fill in the necessary variables such as database connection string and API keys.
5. Start the application:
   ```bash
   npm start
   ```

## Features
- Real-time score updates and notifications
- Customizable user preferences for favorite sports and teams
- Comprehensive news articles and analysis
- Stats and historical data

## API Documentation
### Endpoints
- **GET /api/scores**: Fetch current scores for all sports.
- **GET /api/news**: Retrieve the latest sports news.
- **POST /api/user/preferences**: Save user preferences for a tailored experience.

### Example Request
```json
GET /api/scores
```
### Example Response
```json
{
  "scores": [
    { "team1": "Team A", "team2": "Team B", "score": "1 - 0" },
    { "team1": "Team C", "team2": "Team D", "score": "2 - 2" }
  ]
}
```