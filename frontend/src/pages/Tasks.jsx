import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  InputAdornment,
  Tabs,
  Tab,
  Stack,
  Divider,
  Alert,
  Container,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    assignedTo: '',
    status: 'pending'
  });
  const [workers, setWorkers] = useState([]);
  const [editTask, setEditTask] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'admin') {
      fetchWorkers();
    }
  }, [user]);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, selectedTab, selectedPriority]);

  const filterTasks = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tab filter
    switch (selectedTab) {
      case 0: // All
        break;
      case 1: // Active
        filtered = filtered.filter(task => task.status !== 'finished');
        break;
      case 2: // Completed
        filtered = filtered.filter(task => task.status === 'finished');
        break;
      case 3: // Overdue
        filtered = filtered.filter(task => task.isOverdue);
        break;
      default:
        break;
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(task => task.priority.toLowerCase() === selectedPriority.toLowerCase());
    }

    // Sort by due date
    filtered.sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredTasks(filtered);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks/tasks');
      // Filter tasks based on user role
      const filteredTasks = user?.role === 'admin' 
        ? response.data 
        : response.data.filter(task => task.assignedTo?._id === user?._id);
      setTasks(filteredTasks);
      setFilteredTasks(filteredTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/users/users');
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setError('Failed to fetch workers. Please try again later.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/tasks/${taskId}`, { status: newStatus });
      await fetchTasks(); // Refresh tasks after status update
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status. Please try again.');
    }
  };

  const handleCreateTask = async () => {
    try {
      // Log the task data being sent
      console.log('Creating task with data:', newTask);
      
      // Validate required fields
      if (!newTask.title || !newTask.description || !newTask.dueDate || !newTask.assignedTo) {
        setError('Please fill in all required fields');
        return;
      }

      // Format the due date to ensure it's in the correct format
      const formattedTask = {
        ...newTask,
        dueDate: new Date(newTask.dueDate).toISOString()
      };

      const response = await api.post('/tasks/tasks', formattedTask);
      console.log('Task created successfully:', response.data);
      
      setOpenDialog(false);
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        assignedTo: '',
        status: 'pending'
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      // Log the detailed error response if available
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError(error.response.data.message || 'Failed to create task. Please check all fields and try again.');
      } else {
        setError('Failed to create task. Please try again.');
      }
    }
  };

  const handleEditTask = async () => {
    try {
      const response = await api.put(`/tasks/tasks/${editTask._id}`, editTask);
      setOpenEditDialog(false);
      setEditTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/tasks/tasks/${taskToDelete._id}`);
      setOpenDeleteDialog(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ffa726';
      case 'in_progress':
        return '#29b6f6';
      case 'finished':
        return '#66bb6a';
      default:
        return '#757575';
    }
  };

  const getCompletionStats = () => {
    const userTasks = user?.role === 'admin' 
      ? tasks 
      : tasks.filter(task => task.assignedTo?._id === user?._id);
    
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.status === 'finished').length;
    const active = userTasks.filter(t => t.status !== 'finished').length;
    const overdue = userTasks.filter(t => t.isOverdue).length;
    const totalHours = userTasks.reduce((acc, task) => acc + (task.estimatedHours || 0), 0);
    
    return { total, completed, active, overdue, totalHours };
  };

  const getPriorityDistribution = () => {
    const userTasks = user?.role === 'admin' 
      ? tasks 
      : tasks.filter(task => task.assignedTo?._id === user?._id);

    const distribution = {
      high: { count: 0, color: '#d32f2f' },
      medium: { count: 0, color: '#ffa726' },
      low: { count: 0, color: '#66bb6a' }
    };

    userTasks.forEach(task => {
      if (distribution[task.priority.toLowerCase()]) {
        distribution[task.priority.toLowerCase()].count++;
      }
    });

    return Object.entries(distribution).map(([priority, data]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: data.count,
      color: data.color
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const stats = getCompletionStats();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              {user?.role === 'admin' ? 'All Tasks' : 'My Tasks'}
            </Typography>
          </Grid>
          <Grid item>
            {user?.role === 'admin' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Create Task
              </Button>
            )}
          </Grid>
        </Grid>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTimeIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">Active Tasks</Typography>
                  <Typography variant="h4">{stats.active}</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {((stats.active / stats.total) * 100).toFixed(1)}% of total tasks
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: '#66bb6a', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">Completed Tasks</Typography>
                  <Typography variant="h4">{stats.completed}</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {((stats.completed / stats.total) * 100).toFixed(1)}% completion rate
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimerIcon sx={{ fontSize: 40, color: '#ffa726', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">Total Hours</Typography>
                  <Typography variant="h4">{stats.totalHours}h</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {(stats.totalHours / stats.total).toFixed(1)}h avg. per task
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ fontSize: 40, color: '#d32f2f', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">Overdue Tasks</Typography>
                  <Typography variant="h4">{stats.overdue}</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {((stats.overdue / stats.total) * 100).toFixed(1)}% of total tasks
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Task Distribution by Priority */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Task Distribution by Priority
          </Typography>
          <Grid container spacing={3}>
            {getPriorityDistribution().map((priority) => (
              <Grid item xs={12} sm={6} md={4} key={priority.name}>
                <Paper 
                  sx={{ 
                    p: 2,
                    borderLeft: `4px solid ${priority.color}`,
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      bgcolor: priority.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      mr: 2
                    }}>
                      <FilterListIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" component="div">
                        {priority.name} Priority
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {priority.value} tasks
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {((priority.value / tasks.length) * 100).toFixed(1)}% of total tasks
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Filters and Search */}
        <Paper sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Priority Filter</InputLabel>
                <Select
                  value={selectedPriority}
                  label="Priority Filter"
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="textSecondary">Sort by due date:</Typography>
                <Tooltip title={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}>
                  <IconButton 
                    onClick={() => {
                      setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
                      filterTasks(); // Re-apply filters with new sort order
                    }}
                  >
                    <SortIcon sx={{ transform: sortOrder === 'asc' ? 'none' : 'rotate(180deg)' }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label={`All (${stats.total})`} />
            <Tab label={`Active (${stats.active})`} />
            <Tab label={`Completed (${stats.completed})`} />
            <Tab label={`Overdue (${stats.overdue})`} />
          </Tabs>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Tasks Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow 
                  key={task._id}
                  sx={{
                    backgroundColor: task.isOverdue ? 'rgba(211, 47, 47, 0.1)' : 'inherit',
                    '&:hover': {
                      backgroundColor: task.isOverdue ? 'rgba(211, 47, 47, 0.15)' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{task.assignedTo?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      color={getPriorityColor(task.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        disabled={user?.role !== 'admin' && task.assignedTo?._id !== user?._id}
                        sx={{
                          backgroundColor: getStatusColor(task.status),
                          color: 'white',
                          '.MuiSelect-icon': {
                            color: 'white'
                          }
                        }}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="finished">Finished</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(task.dueDate).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {task.isOverdue && (
                        <Tooltip title="Task is overdue">
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                            <WarningIcon fontSize="small" />
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              Overdue
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                      {user?.role === 'admin' && (
                        <>
                          <Tooltip title="Edit Task">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditTask(task);
                                setOpenEditDialog(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Task">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setTaskToDelete(task);
                                setOpenDeleteDialog(true);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No tasks found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create Task Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                value={newTask.priority}
                label="Priority"
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                required
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="worker-label">Assign To</InputLabel>
              <Select
                labelId="worker-label"
                value={newTask.assignedTo}
                label="Assign To"
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                required
              >
                {workers.map((worker) => (
                  <MenuItem key={worker._id} value={worker._id}>
                    {worker.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Due Date"
              type="datetime-local"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              margin="normal"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Edit Task Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={editTask?.title || ''}
              onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={editTask?.description || ''}
              onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="edit-priority-label">Priority</InputLabel>
              <Select
                labelId="edit-priority-label"
                value={editTask?.priority || ''}
                label="Priority"
                onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                required
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="edit-worker-label">Assign To</InputLabel>
              <Select
                labelId="edit-worker-label"
                value={editTask?.assignedTo || ''}
                label="Assign To"
                onChange={(e) => setEditTask({ ...editTask, assignedTo: e.target.value })}
                required
              >
                {workers.map((worker) => (
                  <MenuItem key={worker._id} value={worker._id}>
                    {worker.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Due Date"
              type="datetime-local"
              value={editTask?.dueDate ? new Date(editTask.dueDate).toISOString().slice(0, 16) : ''}
              onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
              margin="normal"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditTask} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the task "{taskToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteTask} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Tasks; 