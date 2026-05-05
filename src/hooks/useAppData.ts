import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Job, JobTypeRow } from '../types/job'
import { toast } from '@blinkdotnew/ui'

export function useAppData(user: any) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobTypes, setJobTypes] = useState<string[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  const loadData = useCallback(async (userId: string) => {
    setDataLoading(true)
    try {
      const [fetchedJobs, fetchedTypes] = await Promise.all([
        blink.db.jobs.list({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        blink.db.jobTypes.list({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      ])
      
      setJobs(fetchedJobs as unknown as Job[])
      setJobTypes((fetchedTypes as unknown as JobTypeRow[]).map(t => t.name))

      // Migration
      const lsJobs = localStorage.getItem('jobs')
      const lsMigrated = localStorage.getItem('ls_migrated')
      if (lsJobs && !lsMigrated) {
        try {
          const parsed: any[] = JSON.parse(lsJobs)
          if (parsed.length > 0) {
            const toInsert = parsed.map(j => ({
              id: j.id || crypto.randomUUID(),
              userId,
              company: j.company || '',
              role: j.role || '',
              status: j.status || 'Applied',
              jobType: j.jobType || '',
              dateApplied: j.dateApplied || new Date().toISOString().split('T')[0],
              nextStep: j.nextStep || '',
              matchScore: j.matchScore || 0,
              priority: j.priority || 'Medium',
              coverLetterStatus: j.coverLetterStatus || 'Not started',
              followUpDate: j.followUpDate || '',
              interviewNotes: j.interviewNotes || '',
              notes: j.notes || '',
              createdAt: j.createdAt || Date.now()
            }))
            await blink.db.jobs.createMany(toInsert)
            const migrated = await blink.db.jobs.list({ where: { userId }, orderBy: { createdAt: 'desc' } })
            setJobs(migrated as unknown as Job[])
            localStorage.setItem('ls_migrated', '1')
            toast.success(`Migrated ${parsed.length} applications from your browser!`)
          }
        } catch {}
      }
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
    const fetched = await blink.db.jobs.list({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
    setJobs(fetched as unknown as Job[])
  }

  return {
    jobs,
    setJobs,
    jobTypes,
    setJobTypes,
    dataLoading,
    refreshJobs,
    loadData
  }
}