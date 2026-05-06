import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { UserProfile } from '../lib/matchScore'

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfile = useCallback(async (uid: string) => {
    setProfileLoading(true)
    try {
      const { data: rows } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', uid)
        .limit(1)

      if (rows && rows.length > 0) {
        const row = rows[0]
        setProfile({
          skills: row.skills || '',
          education: row.education || '',
          workExperience: row.work_experience || '',
          preferredTitles: row.preferred_titles || '',
          preferredLocations: row.preferred_locations || '',
          otherPreferences: row.other_preferences || '',
          first_name: row.first_name || '',
          last_name: row.last_name || '',
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
