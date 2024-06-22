# Crawlee UI

**THIS IS A WIP**

Crawlee UI is a web application that allows users to configure and run web crawls using a user-friendly interface. It consists of a React frontend for configuring crawls and a Node.js backend powered by Express and Crawlee for performing the actual web crawling.

GitHub Repository: [https://github.com/whit3rabbit/crawlee-ui](https://github.com/whit3rabbit/crawlee-ui)

## Features

- Configure start URLs, link selectors, and glob patterns for crawling
- Custom page function support for advanced scraping scenarios
- Real-time crawl results display
- Rate limiting and error handling
- Configurable crawl depth and concurrency

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or later)
- Yarn package manager
- Git
- Docker and Docker Compose (for containerized deployment)

## Installation

To install Crawlee App, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/whit3rabbit/crawlee-ui.git
   cd crawlee-ui
   ```

2. Set up the environment variables:
   - Copy the `.env.example` file in the `backend` directory to `.env`
   - Modify the values in `.env` as needed

## Usage

### Running with Docker Compose

1. Build and start the containers:
   ```
   docker-compose up --build
   ```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

To stop the application, use:
```
docker-compose down
```

### Running locally

If you prefer to run the application without Docker:

1. Install dependencies:
   ```
   yarn install
   ```

2. Start the application:
   ```
   yarn start
   ```

This will start both the backend server and the frontend development server concurrently.

- The backend server will be available at `http://localhost:3001`
- The frontend will be available at `http://localhost:3000`

## Frontend

The frontend is a React application that provides a user interface for configuring and starting web crawls. It includes:

- A form for entering start URLs, link selectors, and other crawl settings
- A display for showing crawl results
- Integration with the backend API for starting crawls and retrieving results

## Backend

The backend is an Express.js server that handles crawl requests and performs the actual web crawling using Crawlee. Key features include:

- RESTful API for starting crawls and retrieving results
- Input validation using Joi
- Rate limiting to prevent abuse
- Error handling and logging
- Integration with Puppeteer and Crawlee for web crawling

## API Endpoints

- `POST /start-crawl`: Start a new crawl with the provided configuration
- `GET /health`: Health check endpoint