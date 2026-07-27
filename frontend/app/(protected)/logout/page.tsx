'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { Loader2, LogOut } from 'lucide-react'

export default function LogoutPage() {
  const router = useRouter()
  const { logout, user } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    }
  }, [router, user])

  const handleLogout = async () => {
    setError('')
    setIsLoggingOut(true)

    try {
      await logout()
      router.replace('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log out')
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-4 py-10 lg:px-8">
      <Card className="w-full border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>
            You are signed in as {user.fullName}. Confirm if you want to end this session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleLogout} disabled={isLoggingOut} className="gap-2">
              {isLoggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              {isLoggingOut ? 'Signing out...' : 'Logout'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}