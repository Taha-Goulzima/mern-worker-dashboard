const Task = require('../models/Task');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const createTask = async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      assignedBy: req.user._id
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    // Calculate isOverdue for each task
    const tasksWithOverdue = tasks.map(task => {
      const taskObj = task.toObject();
      taskObj.isOverdue = task.status !== 'finished' && new Date() > new Date(task.dueDate);
      return taskObj;
    });

    res.json(tasksWithOverdue);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // If user is worker, they can only update status
    if (req.user.role === 'worker') {
      if (Object.keys(updates).length !== 1 || !updates.status) {
        return res.status(403).json({ error: 'Workers can only update task status' });
      }
    }
    
    const task = await Task.findByIdAndUpdate(id, updates, { new: true })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    console.error('Error getting task stats:', error);
    res.status(500).json({ message: 'Error getting task statistics' });
  }
};

const getRecentTasks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const tasks = await Task.find()
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting recent tasks:', error);
    res.status(500).json({ message: 'Error getting recent tasks' });
  }
};

// Get task statistics by priority
const getTaskPriorityStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    console.error('Error getting task priority stats:', error);
    res.status(500).json({ message: 'Error getting task priority statistics' });
  }
};

// Get worker performance metrics
const getWorkerPerformance = async (req, res) => {
  try {
    const workerId = req.params.workerId;
    const metrics = await Task.aggregate([
      {
        $match: {
          assignedTo: mongoose.Types.ObjectId(workerId)
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'finished'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: { $cond: ['$isOverdue', 1, 0] }
          },
          averageCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'finished'] },
                { $subtract: ['$completedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    res.json(metrics[0] || {
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      averageCompletionTime: 0
    });
  } catch (error) {
    console.error('Error getting worker performance:', error);
    res.status(500).json({ message: 'Error getting worker performance metrics' });
  }
};

// Get overdue tasks
const getOverdueTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ isOverdue: true })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    res.json(tasks);
  } catch (error) {
    console.error('Error getting overdue tasks:', error);
    res.status(500).json({ message: 'Error getting overdue tasks' });
  }
};

// Get tasks by priority
const getTasksByPriority = async (req, res) => {
  try {
    const { priority } = req.params;
    const tasks = await Task.find({ priority })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks by priority:', error);
    res.status(500).json({ message: 'Error getting tasks by priority' });
  }
};

// Add notification to task
const addNotification = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message, type } = req.body;

    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        $push: {
          notifications: {
            message,
            type,
            read: false
          }
        }
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error adding notification:', error);
    res.status(500).json({ message: 'Error adding notification' });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { taskId, notificationId } = req.params;

    const task = await Task.findOneAndUpdate(
      {
        _id: taskId,
        'notifications._id': notificationId
      },
      {
        $set: {
          'notifications.$.read': true
        }
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task or notification not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Export tasks to PDF/Excel
const exportTasks = async (req, res) => {
  try {
    const { format } = req.query;
    const tasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tasks');
      
      // Add columns
      worksheet.columns = [
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Priority', key: 'priority', width: 15 },
        { header: 'Assigned To', key: 'assignedTo', width: 20 },
        { header: 'Due Date', key: 'dueDate', width: 20 },
        { header: 'Is Overdue', key: 'isOverdue', width: 15 }
      ];

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      tasks.forEach(task => {
        worksheet.addRow({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assignedTo?.name || 'Unassigned',
          dueDate: new Date(task.dueDate).toLocaleDateString(),
          isOverdue: task.isOverdue ? 'Yes' : 'No'
        });
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=tasks.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=tasks.pdf');

      doc.pipe(res);
      doc.fontSize(16).text('Tasks Report', { align: 'center' });
      doc.moveDown();

      tasks.forEach(task => {
        doc.fontSize(12).text(`Title: ${task.title}`);
        doc.fontSize(10).text(`Description: ${task.description}`);
        doc.text(`Status: ${task.status}`);
        doc.text(`Priority: ${task.priority}`);
        doc.text(`Assigned To: ${task.assignedTo?.name || 'Unassigned'}`);
        doc.text(`Due Date: ${new Date(task.dueDate).toLocaleDateString()}`);
        doc.text(`Is Overdue: ${task.isOverdue ? 'Yes' : 'No'}`);
        doc.moveDown();
      });

      doc.end();
    }
  } catch (error) {
    console.error('Error exporting tasks:', error);
    res.status(500).json({ message: 'Error exporting tasks' });
  }
};

module.exports = {
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
}; 