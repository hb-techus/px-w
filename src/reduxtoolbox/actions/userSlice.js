import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    firstName: "",
    lastName: "",
    role: "",
  },
  reducers: {
    setUser(state, action) {
      return { ...state, ...action.payload };
    },
    updateUser(state, action) {
      return { ...state, ...action.payload };
    },
    clearUser() {
      return {
        firstName: "",
        lastName: "",
        role: "",
      };
    },
  },
});

export const { setUser, updateUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
