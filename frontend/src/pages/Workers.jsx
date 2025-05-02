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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  Alert,
  Container,
  Chip,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Workers = () => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [newWorker, setNewWorker] = useState({
    name: '',
    email: '',
    password: '',
    role: 'worker'
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/users');
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setError('Failed to fetch workers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorker = async () => {
    try {
      // Validate required fields
      if (!newWorker.name || !newWorker.email || !newWorker.password) {
        setError('Please fill in all required fields');
        return;
      }

      await api.post('/users/register', newWorker);
      setOpenDialog(false);
      setNewWorker({
        name: '',
        email: '',
        password: '',
        role: 'worker'
      });
      fetchWorkers();
    } catch (error) {
      console.error('Error creating worker:', error);
      setError(error.response?.data?.message || 'Failed to create worker. Please try again.');
    }
  };

  const handleEditWorker = async () => {
    try {
      const { password, ...updateData } = selectedWorker;
      await api.put(`/users/users/${selectedWorker._id}`, updateData);
      setOpenEditDialog(false);
      setSelectedWorker(null);
      fetchWorkers();
    } catch (error) {
      console.error('Error updating worker:', error);
      setError('Failed to update worker. Please try again.');
    }
  };

  const handleDeleteWorker = async () => {
    try {
      await api.delete(`/users/users/${selectedWorker._id}`);
      setOpenDeleteDialog(false);
      setSelectedWorker(null);
      fetchWorkers();
    } catch (error) {
      console.error('Error deleting worker:', error);
      setError('Failed to delete worker. Please try again.');
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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Workers Management
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add Worker
            </Button>
          </Grid>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Workers Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Profile</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker._id}>
                  <TableCell>
                    <Avatar
                      src={worker.profilePicture ? `http://localhost:5000/uploads/${worker.profilePicture}` : 'http://localhost:5000/uploads/default-profile.png'}
                      alt={worker.name}
                      sx={{ width: 40, height: 40 }}
                    />
                  </TableCell>
                  <TableCell>{worker.name}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={worker.role}
                      color={worker.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit Worker">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedWorker(worker);
                            setOpenEditDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Worker">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedWorker(worker);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {workers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No workers found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Add Worker Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Worker</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={newWorker.name}
              onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newWorker.email}
              onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={newWorker.password}
              onChange={(e) => setNewWorker({ ...newWorker, password: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateWorker} variant="contained" color="primary">
            Add Worker
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Worker Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Worker</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                src={selectedWorker?.profilePicture ? `http://localhost:5000/uploads/${selectedWorker.profilePicture}` : 'http://localhost:5000/uploads/default-profile.png'}
                alt={selectedWorker?.name}
                sx={{ width: 60, height: 60 }}
              />
              <Typography variant="subtitle1">
                {selectedWorker?.name}
              </Typography>
            </Box>
            <TextField
              label="Name"
              value={selectedWorker?.name || ''}
              onChange={(e) => setSelectedWorker({ ...selectedWorker, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={selectedWorker?.email || ''}
              onChange={(e) => setSelectedWorker({ ...selectedWorker, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="New Password (optional)"
              type="password"
              value={selectedWorker?.password || ''}
              onChange={(e) => setSelectedWorker({ ...selectedWorker, password: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditWorker} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Worker Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Worker</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the worker "{selectedWorker?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteWorker} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Workers; 