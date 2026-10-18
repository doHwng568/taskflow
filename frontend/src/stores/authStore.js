import { create } from 'zustand'
import { jwtDecode } from "jwt-decode"

const getUserFromAccessToken = (accessToken) => {
    const { sub } = jwtDecode(accessToken)
    return sub
}

export const useAuthStore = create((set) => ({

    // state
    accessToken: null,
    username: null,
    isAuthenticated: false,

    // action 
    login: () => {
        set({
            accessToken: null,
            username: "user",
            isAuthenticated: true,
        })
    },

    logout: () => {
        set({
            accessToken: null,
            username: null,
            isAuthenticated: false
        })
    }

}))
