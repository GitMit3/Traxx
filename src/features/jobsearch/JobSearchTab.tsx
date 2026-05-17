import { useState, useEffect, useRef } from 'react'
import {
  Button, Input, Card, CardContent, CardHeader, CardTitle,
  Badge, Dialog, DialogContent, DialogHeader, DialogTitle, EmptyState,
} from '@blinkdotnew/ui'
import { Search, ExternalLink, BookmarkPlus, Check, MapPin, Calendar, Building2, ChevronRight, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../lib/LanguageContext'
import { PlatsbankenJob, UserProfile } from '../../lib/matchScore'
import { toast } from '@blinkdotnew/ui'
import { SWEDISH_LOCATIONS } from '../../lib/constants'

// ─── Static industry list ────────────────────────────────────────────────────

const INDUSTRIES = [
  { id: 'it',         label: 'IT',          keywords: ['it', 'data', 'tech', 'software', 'developer', 'system', 'webb', 'digital', 'programm', 'nätverk', 'cloud', 'devops', 'frontend', 'backend'] },
  { id: 'salj',       label: 'Sälj',        keywords: ['sälj', 'sales', 'account', 'affär', 'kund', 'b2b', 'b2c', 'kommersiell'] },
  { id: 'marknad',    label: 'Marknad',     keywords: ['marknad', 'marketing', 'kommunikat', 'pr', 'content', 'social media', 'varumärk', 'kampanj'] },
  { id: 'ekonomi',    label: 'Ekonomi',     keywords: ['ekonom', 'redovis', 'finans', 'löne', 'controller', 'revisor', 'bokföring', 'budget'] },
  { id: 'hr',         label: 'HR',          keywords: ['hr', 'personal', 'rekryt', 'löne', 'arbetsmiljö', 'kompetens', 'talang'] },
  { id: 'vard',       label: 'Vård',        keywords: ['vård', 'hälsa', 'sjuk', 'läkare', 'sköterska', 'omsorg', 'medicin', 'tandläk', 'apotek', 'rehab'] },
  { id: 'utbildning', label: 'Utbildning',  keywords: ['lärare', 'pedagog', 'utbildning', 'skola', 'förskola', 'rektor', 'undervis', 'lektor'] },
  { id: 'produktion', label: 'Produktion',  keywords: ['produktion', 'industri', 'fabrik', 'lager', 'logistik', 'transport', 'chaufför', 'operatör', 'montör', 'kvalitet'] },
  { id: 'kundservice',label: 'Kundservice', keywords: ['kundservice', 'support', 'helpdesk', 'kundtjänst', 'service desk', 'call center', 'receptionist'] },
]

// ─── Match helpers ────────────────────────────────────────────────────────────

function jobMatchesIndustry(job: PlatsbankenJob, industry: typeof INDUSTRIES[number]): boolean {
  const haystack = `${job.title} ${job.description} ${job.occupation}`.toLowerCase()
  return industry.keywords.some(kw => haystack.includes(kw))
}

function jobMatchesRoleFilter(job: PlatsbankenJob, roleFilter: string): boolean {
  if (!roleFilter.trim()) return true
  const terms = roleFilter.toLowerCase().split(/[\s,]+/).filter(Boolean)
  const haystack = `${job.title} ${job.description} ${job.occupation}`.toLowerCase()
  return terms.some(term => haystack.includes(term))
}

// ─── Component ────────────────────────────────────────────────────────────────

interface JobSearchTabProps {
  user: any
  onJobSaved: () => void
  userProfile?: UserProfile | null
  jobTypes?: string[]
  onJobTypesChange?: () => void
}

export function JobSearchTab({ user, onJobSaved, userProfile }: JobSearchTabProps) {
  const { t } = useLanguage()

  // Search state
  const [keyword, setKeyword]     = useState('')
  const [location, setLocation]   = useState('')
  const [results, setResults]     = useState<PlatsbankenJob[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [savedIds, setSavedIds]   = useState<Set<string>>(new Set())
  const [savingId, setSavingId]   = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<PlatsbankenJob | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  // Ref to hold the latest query parts so the page-change effect can re-run the search
  const lastQueryRef = useRef<string>('')

  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const locationWrapperRef = useRef<HTMLDivElement>(null)

  // Filter state
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState('')

  const handleLocationChange = (val: string) => {
    setLocation(val)
    if (val.trim().length === 0) {
      setLocationSuggestions([])
      return
    }
    const lower = val.toLowerCase()
    setLocationSuggestions(
      SWEDISH_LOCATIONS.filter(city => city.toLowerCase().startsWith(lower) && city.toLowerCase() !== lower)
    )
  }

  const handleLocationSelect = (city: string) => {
    setLocation(city)
    setLocationSuggestions([])
  }

  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setLocationSuggestions([])
    if (e.key === 'Enter' && canSearch) { setLocationSuggestions([]); handleSearch() }
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(e.target as Node)) {
        setLocationSuggestions([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleIndustry = (id: string) => {
    setSelectedIndustries(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const hasActiveFilters = selectedIndustries.length > 0 || roleFilter.trim() !== ''
  // Search is enabled when any input is provided
  const canSearch = keyword.trim() !== '' || location.trim() !== '' || roleFilter.trim() !== '' || selectedIndustries.length > 0

  const clearFilters = () => {
    setSelectedIndustries([])
    setRoleFilter('')
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  // ── Core fetch function (used by both handleSearch and page changes) ────────

  const fetchResults = async (q: string, page: number) => {
    setLoading(true)
    setError(null)
    setResults([])
    setHasSearched(true)
    try {
      const url = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(q)}&limit=30&offset=${page * 30}`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setTotalCount(data.total?.value ?? 0)
      const mapped: PlatsbankenJob[] = (data.hits || []).map((hit: any) => ({
        id:            hit.id,
        title:         hit.headline || '',
        employer:      hit.employer?.name || '',
        location:      hit.workplace_address?.municipality || hit.workplace_address?.region || '',
        publishedDate: hit.publication_date ? hit.publication_date.split('T')[0] : '',
        description:   hit.description?.text || '',
        sourceUrl:     hit.webpage_url || hit.application_details?.url || '',
        occupation:    hit.occupation?.label || '',
      }))
      setResults(mapped)
    } catch {
      setError(t('searchError'))
    } finally {
      setLoading(false)
    }
  }

  // Re-run search when page changes (only if a search has already been done)
  useEffect(() => {
    if (!hasSearched || !lastQueryRef.current) return
    fetchResults(lastQueryRef.current, currentPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const handleProfileSearch = async () => {
    if (!userProfile) return
    const titles = userProfile.preferredTitles?.split(/[,\n]+/).map(s => s.trim()).filter(Boolean) || []
    const locations = userProfile.preferredLocations?.split(/[,\n]+/).map(s => s.trim()).filter(Boolean) || []
    // Clear the input fields — the search runs directly from profile data
    setKeyword('')
    setLocation('')
    // Use ALL titles joined as keyword, only the first location
    const q = [...titles, locations[0]].filter(Boolean).join(' ')
    if (!q) return
    lastQueryRef.current = q
    setCurrentPage(0)
    await fetchResults(q, 0)
  }

  const handleSearch = async () => {
    if (!canSearch) return
    // Build query from available inputs: keyword, roleFilter, location
    const queryParts: string[] = []
    if (keyword.trim()) queryParts.push(keyword.trim())
    if (roleFilter.trim() && !keyword.toLowerCase().includes(roleFilter.toLowerCase())) {
      queryParts.push(roleFilter.trim())
    }
    if (location.trim()) queryParts.push(location.trim())
    // If only industries selected and nothing else, use industry label as keyword fallback
    if (queryParts.length === 0 && selectedIndustries.length > 0) {
      const industryLabels = selectedIndustries.map(id => INDUSTRIES.find(i => i.id === id)?.label || '').filter(Boolean)
      queryParts.push(industryLabels.join(' '))
    }
    const q = queryParts.join(' ')
    lastQueryRef.current = q
    setCurrentPage(0)
    await fetchResults(q, 0)
  }

  // ── Save job ────────────────────────────────────────────────────────────────

  const handleSave = async (job: PlatsbankenJob) => {
    setSavingId(job.id)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase.from('jobs').insert({
        user_id:             user.id,
        company:             job.employer,
        role:                job.title,
        status:              'Saved',
        job_type:            job.occupation || '',
        date_applied:        today,
        priority:            'Medium',
        cover_letter_status: 'Not started',
        follow_up_date:      '',
        interview_notes:     '',
        notes:               '',
        job_url:             job.sourceUrl || '',
      })
      if (error) throw error
      setSavedIds(prev => new Set(prev).add(job.id))
      onJobSaved()
      toast.success(t('jobSavedSuccess'))
    } catch {
      toast.error(t('jobSaveFailed'))
    } finally {
      setSavingId(null)
    }
  }

  // ── Filter results ──────────────────────────────────────────────────────────

  const filteredResults = results.filter(job => {
    const passesIndustry =
      selectedIndustries.length === 0 ||
      selectedIndustries.some(id => {
        const ind = INDUSTRIES.find(i => i.id === id)
        return ind ? jobMatchesIndustry(job, ind) : false
      })
    const passesRole = jobMatchesRoleFilter(job, roleFilter)
    return passesIndustry && passesRole
  })

  // ── Misc ────────────────────────────────────────────────────────────────────


  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Search inputs ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search size={18} className="text-primary" />
            {t('searchJobs')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('searchJobsDesc')}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
                {t('searchKeyword')}
              </label>
              <Input
                placeholder={t('keywordPlaceholder')}
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canSearch && handleSearch()}
              />
            </div>
            <div className="flex-1 relative" ref={locationWrapperRef}>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
                {t('searchLocation')}
              </label>
              <Input
                placeholder={t('locationPlaceholder')}
                value={location}
                onChange={e => handleLocationChange(e.target.value)}
                onKeyDown={handleLocationKeyDown}
                autoComplete="off"
              />
              {locationSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                  {locationSuggestions.map(city => (
                    <li key={city}>
                      <button
                        type="button"
                        onMouseDown={e => { e.preventDefault(); handleLocationSelect(city) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {city}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              {userProfile && (
                <Button variant="outline" onClick={handleProfileSearch} disabled={loading} className="gap-2 w-full sm:w-auto">
                  <Search size={15} />
                  {t('searchFromProfile')}
                </Button>
              )}
              <Button onClick={handleSearch} disabled={loading || !canSearch} className="gap-2 w-full sm:w-auto">
                <Search size={15} />
                {loading ? t('searching') : t('searchBtn')}
              </Button>
            </div>
          </div>
          {!canSearch && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {t('selectFilterFirst')}
            </p>
          )}
          {canSearch && (
            <p className="text-xs text-muted-foreground">{t('apiNotice')}</p>
          )}
        </CardContent>
      </Card>

      {/* ── Filters card ── */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-4 pb-4 space-y-4">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('filterResultsLabel')}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={11} />
                {t('clearFiltersLabel')}
              </button>
            )}
          </div>

          {/* Bransch — checkbox grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
              {t('industryLabel')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {INDUSTRIES.map(ind => {
                const checked = selectedIndustries.includes(ind.id)
                return (
                  <label
                    key={ind.id}
                    className={`flex items-center gap-2 cursor-pointer select-none group`}
                  >
                    <span
                      onClick={() => toggleIndustry(ind.id)}
                      className={`inline-flex items-center justify-center w-4 h-4 rounded border transition-all shrink-0 ${
                        checked
                          ? 'bg-primary border-primary'
                          : 'border-border bg-background group-hover:border-primary/50'
                      }`}
                    >
                      {checked && (
                        <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span
                      onClick={() => toggleIndustry(ind.id)}
                      className={`text-sm transition-colors ${checked ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}
                    >
                      {ind.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Jobbtitel — text filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
              {t('jobTitleFilterLabel')}
            </label>
            <div className="relative">
              <Input
                placeholder={t('jobTitleFilterPlaceholder')}
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="pr-8"
              />
              {roleFilter && (
                <button
                  onClick={() => setRoleFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results count */}
      {results.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {hasActiveFilters
              ? t('matchingJobsCount', { count: filteredResults.length, total: results.length })
              : t('showingJobsRange', { start: currentPage * 30 + 1, end: Math.min((currentPage + 1) * 30, totalCount), total: totalCount.toLocaleString() })
            }
          </span>
          {hasActiveFilters && filteredResults.length === 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              {t('clearFiltersLabel')}
            </button>
          )}
        </div>
      )}

      {/* Empty state — no results after search */}
      {!loading && results.length === 0 && !error && hasSearched && (
        <EmptyState
          icon={<Search />}
          title={t('noJobsFound')}
          description={t('noJobsFoundDesc')}
        />
      )}

      {/* Empty state — filters hide everything */}
      {!loading && results.length > 0 && filteredResults.length === 0 && (
        <div className="rounded-lg border border-border/50 bg-muted/30 px-6 py-8 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">{t('noMatchingJobs')}</p>
          <p className="text-xs text-muted-foreground">{t('tryChangingFilters')}</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-xs text-primary underline-offset-2 hover:underline"
          >
            {t('clearFiltersLabel')}
          </button>
        </div>
      )}

      {/* Results list */}
      <div className="space-y-3">
        {filteredResults.map(job => {
          const isSaved  = savedIds.has(job.id)
          const isSaving = savingId === job.id
          return (
            <Card
              key={job.id}
              className="border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedJob(job)}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-semibold text-base leading-snug text-foreground">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {job.employer && (
                        <span className="flex items-center gap-1.5">
                          <Building2 size={13} className="shrink-0" />
                          {job.employer}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="shrink-0" />
                          {job.location}
                        </span>
                      )}
                      {job.publishedDate && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="shrink-0" />
                          {job.publishedDate}
                        </span>
                      )}
                    </div>
                    {job.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div
                    className="flex flex-row flex-wrap items-center gap-2 shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9" onClick={() => setSelectedJob(job)}>
                      <ChevronRight size={13} />
                      {t('viewDetails')}
                    </Button>
                    {job.sourceUrl && (
                      <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
                          <ExternalLink size={13} />
                          <span className="hidden sm:inline">{t('openOriginal')}</span>
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      disabled={isSaved || isSaving}
                      className="gap-1.5 text-xs h-9"
                      onClick={() => handleSave(job)}
                    >
                      {isSaved ? (
                        <><Check size={13} /><span className="hidden sm:inline">{t('alreadySaved')}</span></>
                      ) : (
                        <><BookmarkPlus size={13} />{isSaving ? t('saving') : t('saveToApplications')}</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Pagination ── */}
      {hasSearched && !loading && totalCount > 30 && (
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>
            {t('previousPage')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('paginationInfo', { page: currentPage + 1, start: currentPage * 30 + 1, end: Math.min((currentPage + 1) * 30, totalCount), total: totalCount.toLocaleString() })}
          </span>
          <Button variant="outline" disabled={(currentPage + 1) * 30 >= totalCount} onClick={() => setCurrentPage(p => p + 1)}>
            {t('nextPage')}
          </Button>
        </div>
      )}

      {/* ── Details Dialog ── */}
      <Dialog open={!!selectedJob} onOpenChange={o => !o && setSelectedJob(null)}>
        <DialogContent className="sm:max-w-[660px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg leading-snug pr-6">{selectedJob?.title}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-5 pt-1">
              {/* Meta */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                {selectedJob.employer && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-primary/70" />
                    {selectedJob.employer}
                  </span>
                )}
                {selectedJob.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-primary/70" />
                    {selectedJob.location}
                  </span>
                )}
                {selectedJob.publishedDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-primary/70" />
                    {selectedJob.publishedDate}
                  </span>
                )}
              </div>

              {/* Full description */}
              <div className="rounded-lg bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap border border-border/40">
                {selectedJob.description || '—'}
              </div>

              {/* Footer */}
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedJob.sourceUrl && (
                  <a href={selectedJob.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2">
                      <ExternalLink size={14} />
                      {t('openOriginal')}
                    </Button>
                  </a>
                )}
                <Button
                  disabled={savedIds.has(selectedJob.id) || savingId === selectedJob.id}
                  className="gap-2"
                  onClick={() => handleSave(selectedJob)}
                >
                  {savedIds.has(selectedJob.id) ? (
                    <><Check size={14} />{t('alreadySaved')}</>
                  ) : (
                    <><BookmarkPlus size={14} />{savingId === selectedJob.id ? t('saving') : t('saveToApplications')}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
