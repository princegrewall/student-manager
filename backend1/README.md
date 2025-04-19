# College Management System - Backend

This is the backend API for the College Management System, built with Node.js, Express, and MongoDB.

## Features

- JWT Authentication (Student-only role)
- Club management (Coding, Cultural, Sports)
- Event management
- Curriculum management
- Library resources
- Attendance tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new student
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current logged-in student profile

### Clubs
- `GET /api/clubs` - Get all clubs
- `POST /api/clubs` - Create a new club
- `GET /api/clubs/:type` - Get a specific club by type
- `PUT /api/clubs/:type/join` - Join a club
- `PUT /api/clubs/:type/leave` - Leave a club

### Events
- `GET /api/events` - Get all events (filter by clubType with query param)
- `POST /api/events` - Create a new event
- `GET /api/events/:id` - Get a specific event
- `PUT /api/events/:id` - Update an event (only by organizer)
- `DELETE /api/events/:id` - Delete an event (only by organizer)

### Curriculum
- `GET /api/curriculum` - Get all curriculum items (filter by semester with query param)
- `POST /api/curriculum` - Add a new curriculum item
- `GET /api/curriculum/:id` - Get a specific curriculum item
- `PUT /api/curriculum/:id` - Update a curriculum item (only by creator)
- `DELETE /api/curriculum/:id` - Delete a curriculum item (only by creator)

### Library
- `GET /api/library` - Get all library items (search by title/author with query param)
- `POST /api/library` - Add a new library item
- `GET /api/library/:id` - Get a specific library item
- `PUT /api/library/:id` - Update a library item (only by creator)
- `DELETE /api/library/:id` - Delete a library item (only by creator)

### Attendance
- `GET /api/attendance/subjects` - Get all subjects for current student
- `POST /api/attendance/subjects` - Create a new subject
- `DELETE /api/attendance/subjects/:id` - Delete a subject
- `GET /api/attendance/subjects/:subjectId/records` - Get attendance records for a subject
- `POST /api/attendance/subjects/:subjectId/records` - Mark attendance for a subject
- `DELETE /api/attendance/records/:id` - Delete an attendance record

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/college-management
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   ```

4. Setup MongoDB
   - **Option 1: Local MongoDB**
     - Install MongoDB locally from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
     - Start MongoDB service
     - Connect using the URI: `mongodb://localhost:27017/college-management`
   
   - **Option 2: MongoDB Atlas (Cloud)**
     - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
     - Create a new cluster
     - Create a database user with read/write permissions
     - Get your connection string and replace the MONGODB_URI in .env file
     - Ensure to replace `<username>`, `<password>`, and `<dbname>` in the URI

5. Run the server:
   - Development mode:
     ```
     npm run dev
     ```
   - Production mode:
     ```
     npm start
     ```

6. The server will be running at `http://localhost:5000`

7. The API can be tested using tools like Postman or by connecting it to the frontend application.

## Frontend Integration

This backend is designed to work with a React frontend. To connect the frontend to this backend:

1. Ensure the backend is running
2. Configure the frontend to make API requests to the correct backend URL (by default: http://localhost:5000/api)
3. Implement authentication flow, including saving and using JWT tokens from login/register responses

## Database Structure

The backend uses the following MongoDB models:

- **Student**: User accounts with authentication
- **Club**: Club types with members
- **Event**: Events organized by students for clubs
- **Curriculum**: Educational materials shared by students
- **Library**: Books, PDFs, and resources shared by students
- **Subject**: Subjects created by students for attendance tracking
- **Attendance**: Daily attendance records per subject

## Technologies Used

- Node.js & Express.js - Backend framework
- MongoDB & Mongoose - Database
- JSON Web Tokens (JWT) - Authentication
- bcryptjs - Password hashing
- cors - Cross-Origin Resource Sharing 