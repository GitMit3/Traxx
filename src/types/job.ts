export type JobStatus = 'Applied' | 'Interviewing' | 'Rejected' | 'Offer' | 'Saved'
export type CoverLetterStatus = 'Not started' | 'Draft ready' | 'Sent'
export type JobPriority = 'High' | 'Medium' | 'Low'

export interface Job {
  id: string
  userId: string
  company: string
  role: string
  status: JobStatus
  jobType: string
  dateApplied: string
  nextStep: string
  matchScore: number
  priority: JobPriority
  coverLetterStatus: CoverLetterStatus
  followUpDate: string
  interviewNotes: string
  notes: string
  jobUrl?: string
  createdAt: number
}

export interface JobTypeRow {
  id: string
  userId: string
  name: string
  createdAt: number
}
