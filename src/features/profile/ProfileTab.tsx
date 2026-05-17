import { useState, useEffect, useRef } from 'react'
import {
  Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea,
  PageDescription, toast, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@blinkdotnew/ui'
import { UserCircle, Camera, GraduationCap, Briefcase, Plus, Edit2, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../lib/LanguageContext'
import { UserProfile } from '../../lib/matchScore'

// ─── Constants ────────────────────────────────────────────────────────────────

const JOB_TITLE_CATEGORIES = [
  {
    label: 'IT & Tech',
    titles: [
      'IT-support', 'Helpdesk', 'Systemadministratör', 'Nätverkstekniker',
      'Frontendutvecklare', 'Backendutvecklare', 'Fullstackutvecklare', 'Webbutvecklare',
      'Applikationsutvecklare', 'Systemutvecklare', 'Mobilutvecklare',
      'DevOps-ingenjör', 'Molnarkitekt', 'Databasadministratör',
      'QA-ingenjör', 'Testledare', 'Mjukvarutestare',
      'Cybersäkerhetsanalytiker', 'IT-säkerhetsspecialist',
      'UX-designer', 'UI-designer', 'Produktdesigner',
      'Data Scientist', 'Dataingenjör', 'Maskininlärningsingenjör',
      'IT-projektledare', 'IT-arkitekt', 'Systemarkitekt',
      'Infrastrukturingenjör', 'Teknisk skribent',
    ],
  },
  {
    label: 'Ledarskap & Projekt',
    titles: [
      'Projektledare', 'Scrum Master', 'Produktägare', 'Teamledare',
      'Programledare', 'Förändringsledare', 'Verksamhetsutvecklare',
      'Affärsutvecklare', 'Strategikonsult', 'Operations Manager',
      'Avdelningschef', 'Enhetschef', 'Processledare', 'VD-assistent',
      'Förvaltningsledare', 'Leveranschef', 'Agile Coach',
      'Portföljledare', 'Kvalitetschef', 'Serviceansvarig',
    ],
  },
  {
    label: 'Sälj & Kundservice',
    titles: [
      'Kundtjänstmedarbetare', 'Kundservicemedarbetare', 'Innesäljare', 'Utesäljare',
      'Säljare', 'Account Manager', 'Key Account Manager', 'Säljansvarig',
      'Kundansvarig', 'Telefonförsäljare', 'Affärsutvecklare',
      'Marknadskoordinator', 'Retail Manager', 'Butikssäljare', 'Regionschef Sälj',
      'Partner Manager', 'Sales Engineer', 'Säljkoordinator',
      'CRM-specialist', 'Kundupplevelsestrateg',
    ],
  },
  {
    label: 'Ekonomi & HR',
    titles: [
      'Ekonomiassistent', 'Redovisningsekonom', 'Controller', 'Finansanalytiker',
      'Ekonomichef', 'CFO', 'Revisionsassistent', 'Löneadministratör',
      'HR-specialist', 'HR-generalist', 'HR-chef', 'Personaladministratör',
      'Rekryterare', 'Talent Acquisition Specialist', 'Compliance Officer',
      'Business Controller', 'Treasury Analyst', 'Internrevisor',
      'HR Business Partner', 'People & Culture Manager',
    ],
  },
  {
    label: 'Utbildning & Vård',
    titles: [
      'Lärare', 'Förskollärare', 'Fritidspedagog', 'Elevassistent', 'Specialpedagog',
      'Skolkurator', 'Rektor', 'Barnskötare', 'Stödpedagog', 'Lärarvikar',
      'Undersköterska', 'Sjuksköterska', 'Specialistsjuksköterska',
      'Vårdbiträde', 'Läkarsekreterare', 'Medicinsk sekreterare',
      'Psykolog', 'Socionom', 'Biståndshandläggare', 'Behandlingsassistent',
    ],
  },
  {
    label: 'Lager & Logistik',
    titles: [
      'Lagerarbetare', 'Lagerkoordinator', 'Lagerchef', 'Truckförare',
      'Logistiker', 'Speditör', 'Transportplanerare', 'Distributionschef',
      'Inköpare', 'Supply Chain Manager', 'Godshanterare', 'Fraktkoordinator',
      'Tulldeklarant', 'Lagerplanerare', 'Orderplockare',
      'Packare', 'Returhanterare', 'Lastbilschaufför',
      'Kurirchaufför', 'Terminalarbetare',
    ],
  },
  {
    label: 'Bygg & Teknik',
    titles: [
      'Elektriker', 'VVS-montör', 'Rörmontör', 'Snickare', 'Svetsare',
      'Byggarbetare', 'Platschef', 'Konstruktör', 'Civilingenjör', 'Ingenjör',
      'CAD-tekniker', 'Fastighetstekniker', 'Fastighetsskötare',
      'Maskinoperatör', 'Drifttekniker',
      'Projektingenjör', 'Anläggningsingenjör', 'Elmontör',
      'Kylmontör', 'Mätningstekniker',
    ],
  },
  {
    label: 'Marknad & Kommunikation',
    titles: [
      'Marknadsförare', 'Content Manager', 'Copywriter', 'SEO-specialist',
      'SEM-specialist', 'Social Media Manager', 'Growth Hacker',
      'Grafisk designer', 'Art Director', 'Brand Manager',
      'Kommunikatör', 'PR-konsult', 'Eventkoordinator',
      'Webbanalytiker', 'E-handelsspecialist',
      'Digital Marketing Manager', 'Performance Marketeer',
      'Affiliate Manager', 'Redaktör', 'Innehållsstrateg',
    ],
  },
]

const LOCATION_REGIONS = [
  {
    label: 'Stockholms län',
    cities: ['Stockholm', 'Solna', 'Sundbyberg', 'Huddinge', 'Nacka', 'Järfälla', 'Täby', 'Haninge', 'Sollentuna', 'Upplands Väsby', 'Botkyrka', 'Tyresö', 'Lidingö', 'Danderyd', 'Södertälje', 'Tumba', 'Sigtuna', 'Norrtälje'],
  },
  {
    label: 'Västra Götaland',
    cities: ['Göteborg', 'Mölndal', 'Borås', 'Trollhättan', 'Uddevalla', 'Skövde', 'Alingsås', 'Lidköping', 'Mariestad', 'Kungälv', 'Lerum', 'Stenungsund', 'Vänersborg', 'Falköping'],
  },
  {
    label: 'Skåne',
    cities: ['Malmö', 'Helsingborg', 'Lund', 'Kristianstad', 'Landskrona', 'Trelleborg', 'Ystad', 'Vellinge', 'Staffanstorp', 'Eslöv', 'Hässleholm', 'Ängelholm', 'Höganäs', 'Klippan'],
  },
  {
    label: 'Uppsala län',
    cities: ['Uppsala', 'Enköping', 'Knivsta', 'Tierp', 'Bålsta', 'Östhammar'],
  },
  {
    label: 'Södermanland',
    cities: ['Eskilstuna', 'Nyköping', 'Katrineholm', 'Strängnäs', 'Flen', 'Oxelösund'],
  },
  {
    label: 'Östergötland',
    cities: ['Linköping', 'Norrköping', 'Motala', 'Mjölby', 'Finspång', 'Söderköping', 'Åtvidaberg'],
  },
  {
    label: 'Jönköpings län',
    cities: ['Jönköping', 'Huskvarna', 'Nässjö', 'Vetlanda', 'Eksjö', 'Värnamo', 'Tranås', 'Sävsjö'],
  },
  {
    label: 'Kronoberg',
    cities: ['Växjö', 'Ljungby', 'Alvesta', 'Markaryd', 'Tingsryd', 'Älmhult'],
  },
  {
    label: 'Kalmar län',
    cities: ['Kalmar', 'Oskarshamn', 'Västervik', 'Nybro', 'Vimmerby', 'Borgholm'],
  },
  {
    label: 'Halland',
    cities: ['Halmstad', 'Varberg', 'Kungsbacka', 'Falkenberg', 'Laholm', 'Hylte'],
  },
  {
    label: 'Blekinge',
    cities: ['Karlskrona', 'Karlshamn', 'Ronneby', 'Sölvesborg', 'Olofström'],
  },
  {
    label: 'Örebro län',
    cities: ['Örebro', 'Karlskoga', 'Kumla', 'Hallsberg', 'Laxå', 'Lindesberg'],
  },
  {
    label: 'Västmanland',
    cities: ['Västerås', 'Köping', 'Sala', 'Arboga', 'Fagersta', 'Surahammar'],
  },
  {
    label: 'Dalarna',
    cities: ['Falun', 'Borlänge', 'Ludvika', 'Avesta', 'Mora', 'Rättvik', 'Malung'],
  },
  {
    label: 'Värmland',
    cities: ['Karlstad', 'Kristinehamn', 'Arvika', 'Sunne', 'Filipstad', 'Hagfors', 'Säffle'],
  },
  {
    label: 'Gävleborg',
    cities: ['Gävle', 'Sandviken', 'Hudiksvall', 'Bollnäs', 'Söderhamn', 'Ljusdal'],
  },
  {
    label: 'Västernorrland',
    cities: ['Sundsvall', 'Härnösand', 'Örnsköldsvik', 'Kramfors', 'Sollefteå', 'Timrå'],
  },
  {
    label: 'Jämtland',
    cities: ['Östersund', 'Åre', 'Strömsund', 'Krokom', 'Bräcke'],
  },
  {
    label: 'Västerbotten',
    cities: ['Umeå', 'Skellefteå', 'Lycksele', 'Storuman', 'Vilhelmina', 'Vindeln'],
  },
  {
    label: 'Norrbotten',
    cities: ['Luleå', 'Kiruna', 'Gällivare', 'Piteå', 'Boden', 'Haparanda', 'Kalix'],
  },
  {
    label: 'Gotland',
    cities: ['Visby', 'Gotland'],
  },
]


// ─── Entry types (Education / Experience) ────────────────────────────────────

interface EduEntry { id: string; program: string; school: string; startYear: string; endYear: string }
interface ExpEntry { id: string; role: string; company: string; startYear: string; endYear: string }

const BLANK_EDU: Omit<EduEntry, 'id'> = { program: '', school: '', startYear: '', endYear: '' }
const BLANK_EXP: Omit<ExpEntry, 'id'> = { role: '', company: '', startYear: '', endYear: '' }

function parseEduEntries(raw: string): EduEntry[] {
  if (!raw?.trim()) return []
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p } catch {}
  return [{ id: crypto.randomUUID(), program: raw.trim(), school: '', startYear: '', endYear: '' }]
}
function parseExpEntries(raw: string): ExpEntry[] {
  if (!raw?.trim()) return []
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p } catch {}
  return [{ id: crypto.randomUUID(), role: raw.trim(), company: '', startYear: '', endYear: '' }]
}

function EduForm({ initial = BLANK_EDU, onSave, onCancel }: { initial?: Omit<EduEntry,'id'>; onSave: (d: Omit<EduEntry,'id'>) => void; onCancel: () => void }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('programDegreeLabel')}</label><Input placeholder={t('programDegreePlaceholder')} value={form.program} onChange={set('program')} /></div>
        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('schoolUniversityLabel')}</label><Input placeholder={t('schoolUniversityPlaceholder')} value={form.school} onChange={set('school')} /></div>
        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('startYearLabel')}</label><Input placeholder={t('startYearPlaceholder')} value={form.startYear} onChange={set('startYear')} /></div>
        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('endYearLabel')}</label><Input placeholder={t('endYearPlaceholder')} value={form.endYear} onChange={set('endYear')} /></div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => { if (form.program.trim()) onSave(form) }}>{t('save')}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>{t('cancelBtn')}</Button>
      </div>
    </div>
  )
}

function ExpForm({ initial = BLANK_EXP, onSave, onCancel }: { initial?: Omit<ExpEntry,'id'>; onSave: (d: Omit<ExpEntry,'id'>) => void; onCancel: () => void }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('jobTitleRoleLabel')}</label><Input placeholder={t('jobTitleRolePlaceholder')} value={form.role} onChange={set('role')} /></div>
        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('company')}</label><Input placeholder={t('companyExpPlaceholder')} value={form.company} onChange={set('company')} /></div>
        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('startYearLabel')}</label><Input placeholder={t('startYearPlaceholder')} value={form.startYear} onChange={set('startYear')} /></div>
        <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('endYearLabel')}</label><Input placeholder={t('endYearExpPlaceholder')} value={form.endYear} onChange={set('endYear')} /></div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => { if (form.role.trim()) onSave(form) }}>{t('save')}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>{t('cancelBtn')}</Button>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProfileTabProps {
  user: any
  profile?: UserProfile | null
  onProfileSaved?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileTab({ user, profile, onProfileSaved }: ProfileTabProps) {
  const { t } = useLanguage()

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Personal info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bio, setBio] = useState('')

  // Profile fields
  const [localProfile, setLocalProfile] = useState<UserProfile>({
    skills: '', education: '', workExperience: '',
    preferredTitles: '', preferredLocations: '', otherPreferences: '',
  })
  const [saving, setSaving] = useState(false)

  // Job title category picker
  const [selectedCategory, setSelectedCategory] = useState('')

  // Location region picker
  const [selectedRegion, setSelectedRegion] = useState('')

  // Structured entries
  const [eduEntries, setEduEntries] = useState<EduEntry[]>([])
  const [expEntries, setExpEntries] = useState<ExpEntry[]>([])
  const [showEduForm, setShowEduForm] = useState(false)
  const [editingEduId, setEditingEduId] = useState<string | null>(null)
  const [showExpForm, setShowExpForm] = useState(false)
  const [editingExpId, setEditingExpId] = useState<string | null>(null)

  // Hydrate from user and profile
  useEffect(() => {
    if (user) {
      setAvatarUrl(user.user_metadata?.avatar_url || '')
    }
  }, [user])

  useEffect(() => {
    if (profile) {
      setLocalProfile(profile)
      setEduEntries(parseEduEntries(profile.education ?? ''))
      setExpEntries(parseExpEntries(profile.workExperience ?? ''))
      setFirstName((profile as any).first_name || '')
      setLastName((profile as any).last_name || '')
      setBio((profile as any).bio || '' )
      // bio stored in otherPreferences prefix hack: we keep a dedicated bio field in display name metadata
    }
  }, [profile])

  // Load bio from user metadata if present
  useEffect(() => {
    if (user?.user_metadata?.bio) {
      setBio(user.user_metadata.bio)
    }
  }, [user])

  // ── Avatar upload ────────────────────────────────────────────────────────

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(publicUrl)
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      toast.success(t('uploadPhoto'))
    } catch {
      toast.error(t('uploadPhotoFailed'))
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ── Education helpers ────────────────────────────────────────────────────
  const handleAddEdu = (data: Omit<EduEntry, 'id'>) => { setEduEntries(p => [...p, { id: crypto.randomUUID(), ...data }]); setShowEduForm(false) }
  const handleUpdateEdu = (id: string, data: Omit<EduEntry, 'id'>) => { setEduEntries(p => p.map(e => e.id === id ? { id, ...data } : e)); setEditingEduId(null) }
  const handleDeleteEdu = (id: string) => setEduEntries(p => p.filter(e => e.id !== id))

  // ── Experience helpers ───────────────────────────────────────────────────
  const handleAddExp = (data: Omit<ExpEntry, 'id'>) => { setExpEntries(p => [...p, { id: crypto.randomUUID(), ...data }]); setShowExpForm(false) }
  const handleUpdateExp = (id: string, data: Omit<ExpEntry, 'id'>) => { setExpEntries(p => p.map(e => e.id === id ? { id, ...data } : e)); setEditingExpId(null) }
  const handleDeleteExp = (id: string) => setExpEntries(p => p.filter(e => e.id !== id))

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)

    // 1. Update display name + bio via auth — failure here is non-blocking
    try {
      const displayName = [firstName, lastName].filter(Boolean).join(' ')
      await supabase.auth.updateUser({
        data: { display_name: displayName || undefined, bio },
      })
    } catch (authErr) {
      console.warn('ProfileTab: auth.updateUser failed (non-blocking):', authErr)
    }

    // 2. Save profile fields to DB
    try {
      const education = JSON.stringify(eduEntries)
      const workExperience = JSON.stringify(expEntries)
      const { skills, preferredTitles, preferredLocations, otherPreferences } = localProfile

      const { error: profileError } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        education,
        work_experience: workExperience,
        skills,
        preferred_titles: preferredTitles,
        preferred_locations: preferredLocations,
        other_preferences: otherPreferences,
        first_name: firstName,
        last_name: lastName,
        bio,
      }, { onConflict: 'user_id' })
      if (profileError) throw profileError

      toast.success(t('profileSaved'))
      onProfileSaved?.()
    } catch (dbErr) {
      console.error('ProfileTab: DB save failed:', dbErr)
      toast.error(t('profileSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  // ── Initials ─────────────────────────────────────────────────────────────

  const initials = (() => {
    const f = firstName.trim()
    const l = lastName.trim()
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase()
    if (f) return f.slice(0, 2).toUpperCase()
    return (user?.email?.[0] || 'U').toUpperCase()
  })()

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">

      {/* ── Avatar + name card ── */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center gap-4">
            {/* Avatar circle */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-md">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">{initials}</span>
                )}
              </div>
              {/* Upload overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label={t('uploadPhoto')}
              >
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera size={20} className="text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Upload button below avatar */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              <Camera size={13} />
              {t('uploadPhoto')}
            </Button>

            {/* Name + email */}
            <div className="text-center space-y-0.5">
              {(firstName || lastName) && (
                <p className="font-semibold text-base text-foreground">
                  {[firstName, lastName].filter(Boolean).join(' ')}
                </p>
              )}
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Personal info ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCircle size={18} className="text-primary" />
            {t('personalInfoTitle')}
          </CardTitle>
          <PageDescription>{t('personalInfoDesc')}</PageDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('profileFirstName')}</label>
              <Input
                placeholder="Anna"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('profileLastName')}</label>
              <Input
                placeholder="Svensson"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('profileBio')}</label>
            <Textarea
              placeholder={t('profileBioPlaceholder')}
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Job titles (bransch dropdown + pills) ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase size={18} className="text-primary" />
            {t('profileTitles')}
          </CardTitle>
          <PageDescription>{t('selectIndustryDesc')}</PageDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const selectedTitles = localProfile.preferredTitles.split(',').map(s => s.trim()).filter(Boolean)
            const toggleTitle = (title: string) => {
              const updated = selectedTitles.includes(title)
                ? selectedTitles.filter(t => t !== title)
                : [...selectedTitles, title]
              setLocalProfile(p => ({ ...p, preferredTitles: updated.join(', ') }))
            }
            const categoryTitles = JOB_TITLE_CATEGORIES.find(c => c.label === selectedCategory)?.titles ?? []

            return (
              <div className="space-y-4">
                {/* Selected titles — compact removable pills */}
                {selectedTitles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {selectedTitles.map(title => (
                      <span
                        key={title}
                        className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
                      >
                        {title}
                        <button
                          type="button"
                          onClick={() => toggleTitle(title)}
                          className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-foreground/20 transition-colors"
                          aria-label={t('removeLabel')}
                        >
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Bransch / industry dropdown */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t('selectIndustryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TITLE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.label} value={cat.label}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Titles for the selected category */}
                {selectedCategory ? (
                  <div className="flex flex-wrap gap-2">
                    {categoryTitles.map(title => {
                      const isSelected = selectedTitles.includes(title)
                      return (
                        <button
                          key={title}
                          type="button"
                          onClick={() => toggleTitle(title)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                          }`}
                        >
                          {title}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {t('selectIndustryFirst')}
                  </p>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* ── Preferred locations ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
            {t('profileLocations')}
          </CardTitle>
          <PageDescription>{t('selectLocationDesc')}</PageDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const selectedLocations = localProfile.preferredLocations.split(',').map(s => s.trim()).filter(Boolean)
            const toggleLocation = (loc: string) => {
              const updated = selectedLocations.includes(loc)
                ? selectedLocations.filter(l => l !== loc)
                : [...selectedLocations, loc]
              setLocalProfile(p => ({ ...p, preferredLocations: updated.join(', ') }))
            }
            const regionCities = LOCATION_REGIONS.find(r => r.label === selectedRegion)?.cities ?? []
            const distansSelected = selectedLocations.includes('Distans')

            return (
              <div className="space-y-4">
                {/* Selected locations — compact removable pills */}
                {selectedLocations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {selectedLocations.map(loc => (
                      <span
                        key={loc}
                        className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
                      >
                        {loc}
                        <button
                          type="button"
                          onClick={() => toggleLocation(loc)}
                          className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-foreground/20 transition-colors"
                          aria-label={t('removeLabel')}
                        >
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Distans — always visible standalone toggle */}
                <button
                  type="button"
                  onClick={() => toggleLocation('Distans')}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    distansSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {t('remoteWork')}
                </button>

                {/* Län / region dropdown */}
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t('selectRegionPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_REGIONS.map(region => (
                      <SelectItem key={region.label} value={region.label}>{region.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Cities for the selected region */}
                {selectedRegion ? (
                  <div className="flex flex-wrap gap-2">
                    {regionCities.map(city => {
                      const isSelected = selectedLocations.includes(city)
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => toggleLocation(city)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                          }`}
                        >
                          {city}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {t('selectRegionFirst')}
                  </p>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* ── Education ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap size={18} className="text-primary" />
                {t('profileEducation')}
              </CardTitle>
            </div>
            {!showEduForm && !editingEduId && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary hover:text-primary" onClick={() => setShowEduForm(true)}>
                <Plus size={13} /> {t('addButton')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {eduEntries.map(entry => (
            <div key={entry.id}>
              {editingEduId === entry.id ? (
                <EduForm initial={{ program: entry.program, school: entry.school, startYear: entry.startYear, endYear: entry.endYear }} onSave={d => handleUpdateEdu(entry.id, d)} onCancel={() => setEditingEduId(null)} />
              ) : (
                <div className="flex items-start justify-between rounded-lg border border-border/60 bg-muted/20 p-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{entry.program}</p>
                    {entry.school && <p className="text-sm text-muted-foreground truncate">{entry.school}</p>}
                    {(entry.startYear || entry.endYear) && <p className="text-xs text-muted-foreground mt-0.5">{[entry.startYear, entry.endYear].filter(Boolean).join(' – ')}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => { setEditingEduId(entry.id); setShowEduForm(false) }}><Edit2 size={13} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteEdu(entry.id)}><Trash2 size={13} /></Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {showEduForm && <EduForm onSave={handleAddEdu} onCancel={() => setShowEduForm(false)} />}
          {eduEntries.length === 0 && !showEduForm && <p className="text-xs text-muted-foreground italic py-1">{t('noEducationYet')}</p>}
        </CardContent>
      </Card>

      {/* ── Work Experience ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase size={18} className="text-primary" />
                {t('profileExperience')}
              </CardTitle>
            </div>
            {!showExpForm && !editingExpId && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary hover:text-primary" onClick={() => setShowExpForm(true)}>
                <Plus size={13} /> {t('addButton')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {expEntries.map(entry => (
            <div key={entry.id}>
              {editingExpId === entry.id ? (
                <ExpForm initial={{ role: entry.role, company: entry.company, startYear: entry.startYear, endYear: entry.endYear }} onSave={d => handleUpdateExp(entry.id, d)} onCancel={() => setEditingExpId(null)} />
              ) : (
                <div className="flex items-start justify-between rounded-lg border border-border/60 bg-muted/20 p-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{entry.role}</p>
                    {entry.company && <p className="text-sm text-muted-foreground truncate">{entry.company}</p>}
                    {(entry.startYear || entry.endYear) && <p className="text-xs text-muted-foreground mt-0.5">{[entry.startYear, entry.endYear].filter(Boolean).join(' – ')}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => { setEditingExpId(entry.id); setShowExpForm(false) }}><Edit2 size={13} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteExp(entry.id)}><Trash2 size={13} /></Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {showExpForm && <ExpForm onSave={handleAddExp} onCancel={() => setShowExpForm(false)} />}
          {expEntries.length === 0 && !showExpForm && <p className="text-xs text-muted-foreground italic py-1">{t('noExperienceYet')}</p>}
        </CardContent>
      </Card>

      {/* ── Skills ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t('profileSkills')}</CardTitle>
          <PageDescription>{t('profileSkillsPlaceholder')}</PageDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t('profileSkillsPlaceholder')}
            value={localProfile.skills}
            onChange={e => setLocalProfile(p => ({ ...p, skills: e.target.value }))}
            className="min-h-[80px] resize-none"
          />
        </CardContent>
      </Card>

      {/* ── Other preferences ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t('profileOther')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t('profileOtherPlaceholder')}
            value={localProfile.otherPreferences}
            onChange={e => setLocalProfile(p => ({ ...p, otherPreferences: e.target.value }))}
            className="min-h-[80px] resize-none"
          />
        </CardContent>
      </Card>

      {/* ── Save button ── */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[160px] h-11 shadow-md shadow-primary/10">
          {saving ? t('savingProfile') : t('saveProfile')}
        </Button>
      </div>

    </div>
  )
}
