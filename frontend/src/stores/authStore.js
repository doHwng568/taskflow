import { create } from 'zustand'
import { jwtDecode } from "jwt-decode"
import { persist } from 'zustand/middleware'

const getUserFromAccessToken = (accessToken) => {
    const { sub } = jwtDecode(accessToken)
    return sub
}

export const useAuthStore = create(

    persist(
        (set) => ({

            // state
            accessToken: null,
            username: null,
            isAuthenticated: false,

            // action 
            login: (accessToken) => {

                const username = getUserFromAccessToken(accessToken);

                set({
                    accessToken: accessToken,
                    username: username,
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
        }),
        {
            name: 'auth-storage'
        }
    )
)