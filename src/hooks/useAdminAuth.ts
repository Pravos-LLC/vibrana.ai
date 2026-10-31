'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'admin_secret'

export function useAdminAuth() {
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load secret from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSecret(stored)
      setAuthenticated(true)
    }
  }, [])

  const login = (newSecret: string) => {
    setSecret(newSecret)
    setAuthenticated(true)
    localStorage.setItem(STORAGE_KEY, newSecret)
  }

  const logout = () => {
    setSecret('')
    setAuthenticated(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    secret,
    authenticated,
    mounted,
    login,
    logout,
    setSecret,
  }
}
