import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'

const ProfilePage: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loading />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-700 dark:text-gray-200">You must be signed in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card>
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">User ID:</span> {user.id}
          </div>
          <div>
            <span className="font-semibold">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-semibold">Created At:</span> {user.created_at}
          </div>
          {user.last_sign_in_at && (
            <div>
              <span className="font-semibold">Last Sign In:</span> {user.last_sign_in_at}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ProfilePage 