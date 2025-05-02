import api from './api';

export const uploadProfilePicture = async (formData) => {
  const response = await api.post('/users/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.patch('/users/me', profileData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
}; 