import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/react'
import { userService } from '../services/userService.js'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const { userId, isLoaded: clerkLoaded, getToken } = useAuth()
  const { user: clerkUser } = useUser()
  const [appUser, setAppUser] = useState(null)
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Sync Clerk authentication with backend
  useEffect(() => {
    const syncClerkAuth = async () => {
      if (!clerkLoaded) return

      try {
        setIsAuthenticating(true)
        setAuthError(null)

        if (!userId) {
          // User is not authenticated
          setAppUser(null)
          localStorage.removeItem('authToken')
          localStorage.removeItem('clerkId')
          console.log('🔓 User logged out - cleared auth tokens')
          setIsAuthenticating(false)
          return
        }

        console.log('🔐 Syncing Clerk auth for userId:', userId)

        // Get Clerk token using getToken function from useAuth
        const token = await getToken()
        if (token) {
          localStorage.setItem('authToken', token)
          console.log('✅ AuthToken stored in localStorage')
        } else {
          console.warn('⚠️ No token returned from Clerk')
        }

        // Store Clerk ID for API calls
        localStorage.setItem('clerkId', userId)
        console.log('✅ ClerkId stored in localStorage:', userId)

        // Store email and name for fallback headers
        if (clerkUser?.primaryEmailAddress?.emailAddress) {
          localStorage.setItem('userEmail', clerkUser.primaryEmailAddress.emailAddress)
          console.log('✅ User email stored:', clerkUser.primaryEmailAddress.emailAddress)
        }

        if (clerkUser?.firstName) {
          const fullName = `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
          localStorage.setItem('userName', fullName)
          console.log('✅ User name stored:', fullName)
        }

        // Check if user exists in database
        let dbUser = await userService.getUserByClerkId(userId)

        // If user doesn't exist, create them
        if (!dbUser) {
          const newUserData = {
            clerkId: userId,
            email: clerkUser?.primaryEmailAddress?.emailAddress || '',
            firstName: clerkUser?.firstName || '',
            lastName: clerkUser?.lastName || '',
            profilePicture: clerkUser?.imageUrl || '',
            username: clerkUser?.username || `user_${userId.slice(0, 8)}`,
          }

          dbUser = await userService.createUser(newUserData)
          console.log('✅ New user created in database:', dbUser._id)
        }

        setAppUser(dbUser)
        console.log('✅ Auth sync complete - user ready')
      } catch (error) {
        console.error('❌ Auth sync error:', error)
        setAuthError(error.message)
        // Still allow app to load but without user data
        if (userId) {
          setAppUser({ clerkId: userId })
        }
      } finally {
        setIsAuthenticating(false)
      }
    }

    syncClerkAuth()
  }, [clerkLoaded, userId, clerkUser])

  return (
    <AuthContext.Provider value={{ appUser, isAuthenticating, authError, clerkLoaded }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAppAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAppAuth must be used within AuthProvider')
  }
  return context
}
