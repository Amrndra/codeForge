'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Loader2, Upload, UserCircle2, Trash2 } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ''

function resolveAvatarUrl(avatarUrl?: string) {
  if (!avatarUrl) {
    return ''
  }

  if (avatarUrl.startsWith('http')) {
    return avatarUrl
  }

  return `${BACKEND_BASE_URL}/${avatarUrl}`.replace(/([^:]\/)\/+/g, '$1')
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, accessToken, setUser, rotateToken } = useAuth()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // State variables for form statuses
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const avatarSrc = useMemo(() => resolveAvatarUrl(user?.avatarUrl), [user?.avatarUrl])

  useEffect(() => {
    if (!user) {
      return
    }

    setFullName(user.fullName ?? '')
    setUsername(user.username ?? '')
    setEmail(user.email ?? '')
  }, [user])

  const initials = user?.fullName
    ? user.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
    : user?.username?.slice(0, 2).toUpperCase()

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSaving(true)

    try {
      const response = await apiFetch('/users/update-profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName,
          username,
          email,
        }),
      })

      setUser(response.data)
      setMessage('Profile updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!avatarFile) {
      setError('Please choose an avatar image first')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const data = await apiFetch('/users/update-avatar', {
        method: 'PATCH',
        body: formData,
      })

      setUser((currentUser) =>
        currentUser
          ? {
            ...currentUser,
            avatarUrl: data.data.avatarUrl,
          }
          : currentUser,
      )
      setAvatarFile(null)
      setMessage('Avatar updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAccount = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!confirmPassword) {
      setError('Please enter your password to confirm account deletion')
      return
    }

    setIsDeleting(true)

    try {
      await apiFetch('/users/delete-user', {
        method: 'DELETE',
        body: JSON.stringify({
          password: confirmPassword,
        }),
      })

      // Wipe out the local client-side user context state and kick back to home
      setUser(null)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Profile settings</h1>
        <p className="mt-2 text-muted-foreground">Update your name, username, email, and avatar.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          {/* Avatar Card */}
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>Upload a new profile image.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-20 border border-border">
                  <AvatarImage src={avatarSrc} alt={user.fullName} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleAvatarUpload}>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Choose image</Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/png,image/jpg,image/jpeg,image/webp"
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  />
                </div>
                <Button type="submit" disabled={isUploading} className="w-full gap-2">
                  {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  Upload avatar
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone: Delete Account */}
          <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Permanently remove your personal account data.</CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="size-4" />
                  Delete Account
                </Button>
              ) : (
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-destructive font-medium">
                      Enter your password to confirm
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Verify your password"
                      className="border-destructive/40 focus-visible:ring-destructive"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={isDeleting}
                      className="w-full gap-2"
                    >
                      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      Permanently Delete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setConfirmPassword('')
                      }}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Form */}
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm h-fit">
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>Change the details shown across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleProfileSave}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Your username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your email address"
                />
              </div>

              {(error || message) && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-success/30 bg-success/10 text-success'}`}>
                  {error || message}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <UserCircle2 className="size-4" />}
                  Save changes
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/')}>
                  Back to home
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}