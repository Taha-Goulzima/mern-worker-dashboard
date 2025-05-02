const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats,
  getRecentTasks,
  getTaskPriorityStats,
  getWorkerPerformance,
  getOverdueTasks,
  getTasksByPriority,
  addNotification,
  markNotificationAsRead,
  exportTasks
} = require('../controllers/taskController');

// Protected routes
router.post('/tasks', auth, createTask);
router.get('/tasks', auth, getTasks);
router.get('/tasks/:id', auth, getTaskById);
router.put('/tasks/:id', auth, updateTask);
router.delete('/tasks/:id', auth, deleteTask);

// Dashboard routes
router.get('/stats', auth, getTaskStats);
router.get('/recent', auth, getRecentTasks);
router.get('/stats/priority', auth, getTaskPriorityStats);

// Performance and metrics routes
router.get('/performance/:workerId', auth, getWorkerPerformance);
router.get('/overdue', auth, getOverdueTasks);
router.get('/priority/:priority', auth, getTasksByPriority);

// Notification routes
router.post('/tasks/:taskId/notifications', auth, addNotification);
router.put('/tasks/:taskId/notifications/:notificationId', auth, markNotificationAsRead);

// Export routes
router.get('/export', auth, exportTasks);

module.exports = router; 