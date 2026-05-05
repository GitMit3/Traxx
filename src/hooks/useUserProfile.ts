import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { UserProfile } from '../lib/matchScore'

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfile = useCallback(async (uid: string) => {
    setProfileLoading(true)
    try {
      const rows = await blink.db.userProfiles.list({ where: { userId: uid } })
      if (rows.length > 0) {
        const row = rows[0] as any
        setProfile({
          skills: row.skills || '',
          education: row.education || '',
          workExperience: row.workExperience || '',
          preferredTitles: row.preferredTitles || '',
          preferredLocations: row.preferredLocations || '',
          otherPreferences: row.otherPreferences || '',
          first_name: row.first_name || row.firstName || '',
          last_name: row.last_name || row.lastName || '',
          bio: row.bio || '',
        } as any)
      }
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userId) loadProfile(userId)
  }, [userId, loadProfile])

  return { profile, setProfile, profileLoading, loadProfile }
}
