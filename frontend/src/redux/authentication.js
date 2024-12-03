// ** Redux Imports
import { createSlice } from '@reduxjs/toolkit'

// ** UseJWT import to get config
import useJwt from '../auth/jwt/useJwt'

const config = useJwt.jwtConfig

const initialUser = () => {
  const item = window.sessionStorage.getItem('userData')
  //** Parse stored json or if none return initialValue
  return item ? JSON.parse(item) : {}
}

export const authSlice = createSlice({
  name: 'authentication',
  initialState: {
    userData: initialUser()
  },
  reducers: {
    handleLogin: (state, action) => {
      state.userData = action.payload
      state[config.storageTokenKeyName] = action.payload[config.storageTokenKeyName]
      state[config.storageRefreshTokenKeyName] = action.payload[config.storageRefreshTokenKeyName]
      sessionStorage.setItem('userData', JSON.stringify(action.payload))
      sessionStorage.setItem(config.storageTokenKeyName, JSON.stringify(action.payload.accessToken))
      sessionStorage.setItem(config.storageRefreshTokenKeyName, JSON.stringify(action.payload.refreshToken))
    },
    handleLogout: state => {
      state.userData = {}
      state[config.storageTokenKeyName] = null
      state[config.storageRefreshTokenKeyName] = null
      // ** Remove user, accessToken & refreshToken from sessionStorage
      sessionStorage.removeItem('userData')
      sessionStorage.removeItem(config.storageTokenKeyName)
      sessionStorage.removeItem(config.storageRefreshTokenKeyName)
    }
  }
})

export const { handleLogin, handleLogout } = authSlice.actions

export default authSlice.reducer
