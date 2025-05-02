import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, CircularProgress, Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const ProfilePictureUpload = () => {
  const { user, updateProfilePicture } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.profilePicture) {
      setPreviewUrl(`http://localhost:5000/uploads/${user.profilePicture}`);
    }
  }, [user?.profilePicture]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      await updateProfilePicture(formData);
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      setError('Failed to upload profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box
        component="img"
        src={previewUrl || 'http://localhost:5000/uploads/default-profile.png'}
        alt="Profile preview"
        sx={{
          width: 150,
          height: 150,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #ccc',
        }}
      />
      
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="profile-picture-upload"
        type="file"
        onChange={handleFileChange}
      />
      
      <label htmlFor="profile-picture-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={loading}
        >
          Choose Image
        </Button>
      </label>

      {selectedFile && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Upload'
          )}
        </Button>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ProfilePictureUpload; 