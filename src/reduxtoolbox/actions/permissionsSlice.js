import { createSlice } from '@reduxjs/toolkit'

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState: {
    data: {},
    loading: true,
  },
  reducers: {
    setPermissions(state, action) {
      const raw =
        action.payload?.permissions ||
        action.payload?.permission_info ||
        action.payload

      state.data = raw || {}
      state.loading = false
    },

    clearPermissions(state) {
      state.data = {}
      state.loading = true
    },

    setLoading(state, action) {
      state.loading = action.payload
    },
  },
})

export const { setPermissions, clearPermissions, setLoading } = permissionsSlice.actions
export default permissionsSlice.reducer
