import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Job } from '../types/job'
import { toast } from '@blinkdotnew/ui'

function rowToJob(row: any): Job {
  return {
    id: row.id,
    userId: row.user_id,
    company: row.company ?? '',
    role: row.role ?? '',
    status: row.status ?? 'Saved',
    jobType: row.job_type ?? '',
    dateApplied: row.date_applied ?? '',
    nextStep: row.next_step ?? '',
    matchScore: row.match_score ?? 0,
    priority: row.priority ?? 'Medium',
    coverLetterStatus: row.cover_letter_status ?? 'Not started',
    followUpDate: row.follow_up_date ?? '',
    interviewNotes: row.interview_notes ?? '',
    notes: row.notes ?? '',
    jobUrl: row.job_url ?? '',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  }
}

export function useAppData(user: any) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobTypes, setJobTypes] = useState<string[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  const loadData = useCallback(async (userId: string) => {
    setDataLoading(true)
    try {
      const [{ data: fetchedJobs, error: jobsError }, { data: fetchedTypes, error: typesError }] = await Promise.all([
        supabase.from('jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('job_types').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      ])

      if (jobsError) throw jobsError
      if (typesError) throw typesError

      setJobs((fetchedJobs ?? []).map(rowToJob))
      setJobTypes((fetchedTypes ?? []).map((t: any) => t.name))

      // Migrate from localStorage
      const lsJobs = localStorage.getItem('jobs')
      const lsMigrated = localStorage.getItem('ls_migrated')
      if (lsJobs && !lsMigrated) {
        try {
          const parsed: any[] = JSON.parse(lsJobs)
          if (parsed.length > 0) {
            const toInsert = parsed.map(j => ({
              user_id: userId,
              company: j.company || '',
              role: j.role || '',
              status: j.status || 'Applied',
              job_type: j.jobType || '',
              date_applied: j.dateApplied || new Date().toISOString().split('T')[0],
              next_step: j.nextStep || '',
              match_score: j.matchScore || 0,
              priority: j.priority || 'Medium',
              cover_letter_status: j.coverLetterStatus || 'Not started',
              follow_up_date: j.followUpDate || '',
              interview_notes: j.interviewNotes || '',
              notes: j.notes || '',
            }))
            await supabase.from('jobs').insert(toInsert)
            const { data: migrated } = await supabase
              .from('jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false })
            setJobs((migrated ?? []).map(rowToJob))
            localStorage.setItem('ls_migrated', '1')
            toast.success(`Migrated ${parsed.length} applications from your browser!`)
          }
        } catch {}
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load data')
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadData(user.id)
    }
  }, [user, loadData])

  const refreshJobs = async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) { toast.error(error.message || 'Failed to refresh jobs'); return }
    setJobs((data ?? []).map(rowToJob))
  }

  return { jobs, setJobs, jobTypes, setJobTypes, dataLoading, refreshJobs, loadData }
}
