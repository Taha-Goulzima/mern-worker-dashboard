# Task Management System

A modern, full-stack task management application built with the MERN stack (MongoDB, Express.js, React, Node.js) that helps teams collaborate effectively and track their work efficiently.

![Task Management System](screenshot.png) <!-- You'll need to add a screenshot of your application -->

## 🌟 Features

### For Administrators
- 📊 Comprehensive dashboard with task statistics and analytics
- 👥 Worker management system
- 📈 Performance tracking and reporting
- 📤 Export functionality (Excel/PDF)
- 🔒 Role-based access control

### For Workers
- 📝 Task management and tracking
- 🔔 Real-time notifications
- 📱 Responsive design for all devices
- 👤 Profile management with picture upload
- 📅 Deadline tracking and reminders

## 🛠️ Tech Stack

### Frontend
- React.js
- Material-UI
- Axios
- React Router
- Recharts (for data visualization)

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Multer (for file uploads)

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/task-management-system.git
cd task-management-system
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

5. Start the backend server
```bash
cd backend
npm start
```

6. Start the frontend development server
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure
