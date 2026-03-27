import AuthGuard from '@/components/AuthGuard'
import React from 'react'

function Guard({ children }: { children: React.ReactNode }) {
  'use client'
  return (
    <AuthGuard requiredPerms={['ADMIN_USERS_READ']} redirectTo="/login">
      {children}
    </AuthGuard>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Guard>{children}</Guard>
}
