import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  project_id: null,
  project_uuid: null,
  project_name: null,
};
const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProjectData: (state, action) => {
      state.project_id   = action.payload.project_id;
      state.project_uuid = action.payload.project_uuid;
      state.project_name = action.payload.project_name;
    },
    clearProjectData: (state) => {
      state.project_id   = null;
      state.project_uuid = null;
      state.project_name = null;
    },
  },
});

export const { setProjectData, clearProjectData } = projectSlice.actions;
export default projectSlice.reducer;