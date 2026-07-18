import { createSlice } from "@reduxjs/toolkit";

const keySlice = createSlice({
  name: "tokens",
  initialState: {},

  reducers: {
    addTokens: (state, action) => {
      Object.assign(state, action.payload);
    },

    removeToken: (state, action) => {
      delete state[action.payload];
    },

    clearAllToken: () => {
      return {};
    },
  },
});

export const { addTokens, removeToken, clearAllToken } = keySlice.actions;
export default keySlice.reducer;