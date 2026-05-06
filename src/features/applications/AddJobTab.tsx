import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, toast, Textarea } from '@blinkdotnew/ui'
import { Plus, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { JobStatus, JobPriority } from '../../types/job'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../lib/LanguageContext'
import { JOB_TITLE_CATEGORIES } from '../../lib/constants'

interface CvFile { id: string; name: string }
interface CoverLetter { id: string; title: string }

interface AddJobTabProps {
  user: any
  jobTypes: string[]
  onRefresh: () => void
}

export function AddJobTab({ user, jobTypes, onRefresh }: AddJobTabProps) {
  const { t } = useLanguage()

  const emptyForm = {
    company: '',
    role: '',
    status: 'Applied' as JobStatus,
    jobType: '',
    dateApplied: new Date().toISOString().split('T')[0],
    nextStep: '',
    matchScore: 0,
    priority: 'Medium' as JobPriority,
    coverLetterStatus: 'Not started' as const,
    followUpDate: '',
    interviewNotes: '',
    notes: '',
    jobUrl: ''
  }

  const [formData, setFormData] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [showMore, setShowMore] = useState(false)

  // Document linking
  const [cvFiles, setCvFiles] = useState<CvFile[]>([])
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [selectedCvId, setSelectedCvId] = useState('__none__')
  const [selectedClId, setSelectedClId] = useState('__none__')

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const [{ data: cvs }, { data: cls }] = await Promise.all([
          supabase.from('cv_files').select('id, name').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('cover_letters').select('id, title').eq('user_id', user.id).order('created_at', { ascending: false }),
        ])
        setCvFiles((cvs ?? []) as CvFile[])
        setCoverLetters((cls ?? []) as CoverLetter[])
      } catch { /* silent */ }
    }
    loadDocs()
  }, [user.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.company || !formData.role) {
      toast.error(t('fillCompanyAndRole'))
      return
    }
    setLoading(true)
    try {
      const selectedCv = cvFiles.find(c => c.id === selectedCvId)
      const selectedCl = coverLetters.find(c => c.id === selectedClId)

      const { error } = await supabase.from('jobs').insert({
        user_id: user.id,
        company: formData.company,
        role: formData.role,
        status: formData.status,
        job_type: formData.jobType,
        date_applied: formData.dateApplied,
        next_step: formData.nextStep,
        match_score: formData.matchScore,
        priority: formData.priority,
        cover_letter_status: formData.coverLetterStatus,
        follow_up_date: formData.followUpDate,
        interview_notes: formData.interviewNotes,
        notes: [
          formData.notes,
          selectedCv ? `CV: ${selectedCv.name}` : '',
          selectedCl ? `Cover letter: ${selectedCl.title}` : '',
        ].filter(Boolean).join('\n'),
        job_url: formData.jobUrl,
      })
      if (error) throw error
      toast.success(t('applicationAdded'))
      setFormData({ ...emptyForm })
      setSelectedCvId('')
      setSelectedClId('')
      setShowMore(false)
      onRefresh()
    } catch {
      toast.error(t('failedToAdd'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/50 shadow-sm max-w-4xl mx-auto animate-in slide-in-from-top-4 duration-500">
      <CardHeader className="pb-4 px-4 sm:px-6">
        <CardTitle className="text-lg">{t('addNewApplication')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

          {/* Core fields — single column on mobile */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t('company')}</label>
              <Input
                placeholder={t('companyPlaceholder')}
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t('role')}</label>
              <Input
                placeholder={t('rolePlaceholder')}
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t('status')}</label>
              <Select value={formData.status} onValueChange={(val: any) => setFormData({ ...formData, status: val, priority: val === 'Rejected' ? 'Low' : formData.priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['Saved', 'Applied', 'Interviewing', 'Rejected', 'Offer'] as JobStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{t(`status${s}` as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t('dateApplied')}</label>
              <Input
                type="date"
                value={formData.dateApplied}
                onChange={e => setFormData({ ...formData, dateApplied: e.target.value })}
              />
            </div>
          </div>

          {/* More details toggle */}
          <div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMore(v => !v) }}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showMore ? t('hideDetails') : t('moreDetails')}
            </button>

            {showMore && (
              <div className="grid grid-cols-1 gap-4 mt-4 pt-4 border-t border-border/40">
                {/* Job Type */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t('jobType')}</label>
                  {true ? (
                    <Select
                      value={formData.jobType || '__none__'}
                      onValueChange={val => setFormData({ ...formData, jobType: val === '__none__' ? '' : val })}
                    >
                      <SelectTrigger><SelectValue placeholder={t('selectJobType') || 'Select type…'} /></SelectTrigger>
                      <SelectContent className="max-h-48 overflow-y-auto">
                        <SelectItem value="__none__">{t('noJobType') || 'None'}</SelectItem>
                        {JOB_TITLE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.label} value={cat.label}>{cat.label}</SelectItem>
                        ))}
                        {jobTypes.filter(tp => tp).map(tp => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">
                      {t('noJobTypesYet') || 'Add job types in Job Search to use them here.'}
                    </p>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t('priority')}</label>
                  <div className="flex gap-1.5">
                    {(['High', 'Medium', 'Low'] as JobPriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`flex-1 h-12 rounded-lg border text-xs font-semibold transition-all ${
                          formData.priority === p
                            ? p === 'High'
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : p === 'Medium'
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'bg-sky-500 border-sky-500 text-white'
                            : 'bg-background border-border/60 text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {t(`priority${p}` as any)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t('followUpDate')}</label>
                  <Input
                    type="date"
                    value={formData.followUpDate}
                    onChange={e => setFormData({ ...formData, followUpDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t('nextStep')}</label>
                  <Input
                    placeholder={t('nextStepPlaceholder')}
                    value={formData.nextStep}
                    onChange={e => setFormData({ ...formData, nextStep: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Länk till annons</label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={formData.jobUrl || ''}
                    onChange={e => setFormData({ ...formData, jobUrl: e.target.value })}
                  />
                </div>

                {/* Document linking section */}
                <div className="pt-2 border-t border-border/30 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <FileText size={12} />
                    Dokument (valfritt)
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">{t('cvFiles') || 'CV'}</label>
                      <Select value={selectedCvId} onValueChange={setSelectedCvId}>
                        <SelectTrigger><SelectValue placeholder={t('selectCv') || 'Select CV…'} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('noneSelected') || 'None'}</SelectItem>
                          {cvFiles.map(cv => <SelectItem key={cv.id} value={cv.id}>{cv.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">{t('coverLetters') || 'Cover Letter'}</label>
                      <Select value={selectedClId} onValueChange={setSelectedClId}>
                        <SelectTrigger><SelectValue placeholder={t('selectCoverLetter') || 'Select cover letter…'} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('noneSelected') || 'None'}</SelectItem>
                          {coverLetters.map(cl => <SelectItem key={cl.id} value={cl.id}>{cl.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(cvFiles.length === 0 && coverLetters.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">
                      {t('noDocumentsYet') || 'Upload CVs and cover letters in the Documents tab.'}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t('generalNotes')}</label>
                  <Textarea
                    placeholder={t('generalNotesPlaceholder')}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full h-14 sm:h-10 text-base sm:text-sm gap-2" disabled={loading}>
            <Plus size={16} />
            {loading ? t('adding') : t('addApplication')}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
