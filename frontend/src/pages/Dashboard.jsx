import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Button,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip
} from '@mui/material';
import {
  Assignment as TaskIcon,
  People as PeopleIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  FileDownload as FileDownloadIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [priorityStats, setPriorityStats] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'admin') {
          // Admin dashboard data
          const [
            statsResponse,
            priorityResponse,
            tasksResponse,
            overdueResponse
          ] = await Promise.all([
            api.get('/tasks/stats'),
            api.get('/tasks/stats/priority'),
            api.get('/tasks/recent'),
            api.get('/tasks/overdue')
          ]);
          setStats(statsResponse.data);
          setPriorityStats(priorityResponse.data);
          setRecentTasks(tasksResponse.data);
          setOverdueTasks(overdueResponse.data);
        } else {
          // Worker dashboard data
          const [tasksResponse, overdueResponse] = await Promise.all([
            api.get('/tasks/tasks'),
            api.get('/tasks/overdue')
          ]);
          
          // Filter tasks for the current worker
          const workerTasks = tasksResponse.data.filter(task => 
            task.assignedTo?._id === user?._id
          );
          const workerOverdueTasks = overdueResponse.data.filter(task => 
            task.assignedTo?._id === user?._id
          );
          
          setRecentTasks(workerTasks);
          setOverdueTasks(workerOverdueTasks);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/tasks/export?format=${format}`, {
        responseType: 'blob',
        headers: {
          'Accept': format === 'excel' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf'
        }
      });

      const blob = new Blob([response.data], {
        type: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting tasks:', error);
    }
  };

  const handlePriorityFilter = async (priority) => {
    try {
      setSelectedPriority(priority);
      if (priority === 'all') {
        const response = await api.get('/tasks/tasks');
        const tasks = response.data.filter(task => 
          user?.role === 'admin' || task.assignedTo?._id === user?._id
        );
        setRecentTasks(tasks);
      } else {
        const response = await api.get(`/tasks/priority/${priority}`);
        const tasks = response.data.filter(task => 
          user?.role === 'admin' || task.assignedTo?._id === user?._id
        );
        setRecentTasks(tasks);
      }
    } catch (error) {
      console.error('Error filtering tasks:', error);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return '#d32f2f';
      case 'High':
        return '#f57c00';
      case 'Medium':
        return '#1976d2';
      case 'Low':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Welcome, {user?.name}!
        </Typography>
        <Box>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <FilterListIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => handlePriorityFilter('all')}>All Tasks</MenuItem>
            <MenuItem onClick={() => handlePriorityFilter('Urgent')}>Urgent</MenuItem>
            <MenuItem onClick={() => handlePriorityFilter('High')}>High</MenuItem>
            <MenuItem onClick={() => handlePriorityFilter('Medium')}>Medium</MenuItem>
            <MenuItem onClick={() => handlePriorityFilter('Low')}>Low</MenuItem>
          </Menu>
          {user?.role === 'admin' && (
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={(e) => setExportMenuAnchorEl(e.currentTarget)}
              sx={{ ml: 2 }}
            >
              Export
            </Button>
          )}
          {user?.role === 'admin' && (
            <Menu
              anchorEl={exportMenuAnchorEl}
              open={Boolean(exportMenuAnchorEl)}
              onClose={() => setExportMenuAnchorEl(null)}
            >
              <MenuItem onClick={() => {
                handleExport('excel');
                setExportMenuAnchorEl(null);
              }}>
                Export as Excel
              </MenuItem>
              <MenuItem onClick={() => {
                handleExport('pdf');
                setExportMenuAnchorEl(null);
              }}>
                Export as PDF
              </MenuItem>
            </Menu>
          )}
        </Box>
      </Box>

      {user?.role === 'admin' ? (
        // Admin Dashboard
        <Grid container spacing={3}>
          {/* Task Statistics */}
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Tasks
                </Typography>
                <Typography variant="h4">
                  {stats?.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed Tasks
                </Typography>
                <Typography variant="h4">
                  {stats?.completed || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Tasks
                </Typography>
                <Typography variant="h4">
                  {stats?.pending || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Overdue Tasks
                </Typography>
                <Typography variant="h4">
                  {overdueTasks.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Task Distribution by Priority */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Task Distribution by Priority
              </Typography>
              <Grid container spacing={2}>
                {priorityStats.map((stat) => (
                  <Grid item xs={12} sm={4} key={stat._id}>
                    <Card sx={{ 
                      bgcolor: getPriorityColor(stat._id),
                      color: 'white',
                      '&:hover': {
                        opacity: 0.9
                      }
                    }}>
                      <CardContent>
                        <Typography variant="h6">
                          {stat._id}
                        </Typography>
                        <Typography variant="h4">
                          {stat.count}
                        </Typography>
                        <Typography variant="body2">
                          {((stat.count / (stats?.total || 1)) * 100).toFixed(1)}% of total
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Recent Tasks */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Tasks
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Overdue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTasks.map((task) => (
                      <TableRow key={task._id}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority}
                            size="small"
                            sx={{ 
                              backgroundColor: getPriorityColor(task.priority),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              backgroundColor: getStatusColor(task.status),
                              color: 'white',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              display: 'inline-block'
                            }}
                          >
                            {task.status.replace('_', ' ')}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {task.isOverdue ? (
                            <Chip
                              label="Overdue"
                              color="error"
                              size="small"
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // Worker Dashboard
        <Grid container spacing={3}>
          {/* Task Summary */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                My Tasks
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Overdue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTasks.map((task) => (
                      <TableRow key={task._id}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority}
                            size="small"
                            sx={{ 
                              backgroundColor: getPriorityColor(task.priority),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              backgroundColor: getStatusColor(task.status),
                              color: 'white',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              display: 'inline-block'
                            }}
                          >
                            {task.status.replace('_', ' ')}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {task.isOverdue ? (
                            <Chip
                              label="Overdue"
                              color="error"
                              size="small"
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Overdue Tasks */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Overdue Tasks
              </Typography>
              <List>
                {overdueTasks.map((task) => (
                  <React.Fragment key={task._id}>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
                {overdueTasks.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No overdue tasks"
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard; 