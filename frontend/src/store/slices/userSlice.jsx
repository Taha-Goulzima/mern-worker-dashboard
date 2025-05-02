import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import userService from '../../services/userService';

export const updateProfilePicture = createAsyncThunk(
  'user/updateProfilePicture',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await userService.uploadProfilePicture(formData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // ... existing reducers ...
  },
  extraReducers: (builder) => {
    // ... existing extraReducers ...
    builder
      .addCase(updateProfilePicture.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateProfilePicture.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = { ...state.user, profilePicture: action.payload.profilePicture };
      })
      .addCase(updateProfilePicture.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to update profile picture';
      });
  },
});

export default userSlice.reducer; 