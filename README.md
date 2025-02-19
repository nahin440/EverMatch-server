# EverMatch Server

## Overview
The **EverMatch Server** is the backend service for the EverMatch application, a platform designed to connect users based on their preferences and biodata. This server handles authentication, user management, biodata management, and admin functionalities.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: Firebase Auth / JWT
- **Hosting**: Vercel

## Features
- User authentication (login, register, Google login)
- Biodata management (create, update, delete, view)
- Admin dashboard for managing users and approving requests
- Contact request handling
- Secure API endpoints

## Installation

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/evermatch-server.git
   cd evermatch-server
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and add your environment variables:
   ```sh
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   FIREBASE_CONFIG=your_firebase_config
   ```
4. Start the development server:
   ```sh
   npm run dev
   ```

## API Endpoints
| Method | Endpoint                     | Description                  |
|--------|------------------------------|------------------------------|
| POST   | `/api/auth/register`         | Register a new user          |
| POST   | `/api/auth/login`            | Log in a user                |
| GET    | `/api/biodata`               | Get all biodata              |
| POST   | `/api/biodata`               | Create a new biodata entry   |
| PUT    | `/api/biodata/:id`           | Update a biodata entry       |
| DELETE | `/api/biodata/:id`           | Delete a biodata entry       |
| GET    | `/api/admin/users`           | Get all users (Admin)        |

## Deployment
This server is deployed on **Vercel**. To deploy your own instance:
1. Install the Vercel CLI:
   ```sh
   npm install -g vercel
   ```
2. Deploy the project:
   ```sh
   vercel
   ```


