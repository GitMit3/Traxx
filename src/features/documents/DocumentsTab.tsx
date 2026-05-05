import { useState, useEffect, useRef } from 'react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Badge, toast,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Textarea, EmptyState,
} from '@blinkdotnew/ui'
import { FileText, Upload, Trash2, Edit2, Plus, Download, FileCheck, Loader2 } from 'lucide-react'
import { blink } from '../../blink/client'
import { useLanguage } from '../../lib/LanguageContext'

interface DocumentsTabProps {
  user: any
}

interface CvFile {
  id: string
  userId: string
  name: string
  fileUrl: string
  fileSize: number
  fileType: string
  createdAt: number
  updatedAt: number
}

interface CoverLetter {
  id: string
  userId: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileTypeBadge(fileType: string, fileName: string): string {
  if (fileType?.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf')) return 'PDF'
  if (fileType?.includes('word') || fileName?.toLowerCase().endsWith('.docx')) return 'DOCX'
  return fileType?.split('/')[1]?.toUpperCase() ?? 'FILE'
}

export function DocumentsTab({ user }: DocumentsTabProps) {
  const { t } = useLanguage()

  // ── CV Files ──────────────────────────────────────────────────────────────
  const [cvFiles, setCvFiles] = useState<CvFile[]>([])
  const [cvLoading, setCvLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingCvId, setEditingCvId] = useState<string | null>(null)
  const [editingCvName, setEditingCvName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Cover Letters ─────────────────────────────────────────────────────────
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [clLoading, setClLoading] = useState(true)
  const [clDialogOpen, setClDialogOpen] = useState(false)
  const [clEditTarget, setClEditTarget] = useState<CoverLetter | null>(null)
  const [clTitle, setClTitle] = useState('')
  const [clContent, setClContent] = useState('')
  const [clSaving, setClSaving] = useState(false)

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadCvFiles = async () => {
    try {
      const rows = await blink.db.cvFiles.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }) as unknown as CvFile[]
      setCvFiles(rows)
    } catch {
      toast.error(t('cvFilesLoadFailed'))
    } finally {
      setCvLoading(false)
    }
  }

  const loadCoverLetters = async () => {
    try {
      const rows = await blink.db.coverLetters.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }) as unknown as CoverLetter[]
      setCoverLetters(rows)
    } catch {
      toast.error(t('coverLettersLoadFailed'))
    } finally {
      setClLoading(false)
    }
  }

  useEffect(() => {
    loadCvFiles()
    loadCoverLetters()
  }, [user.id])

  // ── CV File: upload ───────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // reset input so same file can be re-uploaded
    e.target.value = ''

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'pdf'
      const path = `cv-files/${user.id}/${Date.now()}.${ext}`
      const { publicUrl } = await blink.storage.upload(file, path)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      await blink.db.cvFiles.create({
        id: crypto.randomUUID(),
        userId: user.id,
        name: nameWithoutExt,
        fileUrl: publicUrl,
        fileSize: file.size,
        fileType: file.type,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      toast.success(t('cvUploaded'))
      await loadCvFiles()
    } catch (err: any) {
      toast.error(err?.message ?? t('cvUploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  // ── CV File: rename ───────────────────────────────────────────────────────
  const startEditCv = (cv: CvFile) => {
    setEditingCvId(cv.id)
    setEditingCvName(cv.name)
  }

  const saveEditCv = async (id: string) => {
    if (!editingCvName.trim()) return
    try {
      await blink.db.cvFiles.update(id, { name: editingCvName.trim(), updatedAt: Date.now() })
      setCvFiles(prev => prev.map(c => c.id === id ? { ...c, name: editingCvName.trim() } : c))
      toast.success(t('cvNameUpdated'))
    } catch {
      toast.error(t('cvNameUpdateFailed'))
    } finally {
      setEditingCvId(null)
      setEditingCvName('')
    }
  }

  // ── CV File: delete ───────────────────────────────────────────────────────
  const deleteCv = async (id: string) => {
    try {
      await blink.db.cvFiles.delete(id)
      setCvFiles(prev => prev.filter(c => c.id !== id))
      toast.success(t('cvDeleted'))
    } catch {
      toast.error(t('cvDeleteFailed'))
    }
  }

  // ── Cover Letters: open dialog ────────────────────────────────────────────
  const openNewCl = () => {
    setClEditTarget(null)
    setClTitle('')
    setClContent('')
    setClDialogOpen(true)
  }

  const openEditCl = (cl: CoverLetter) => {
    setClEditTarget(cl)
    setClTitle(cl.title)
    setClContent(cl.content)
    setClDialogOpen(true)
  }

  const closeCl = () => {
    setClDialogOpen(false)
    setClEditTarget(null)
    setClTitle('')
    setClContent('')
  }

  // ── Cover Letters: save ───────────────────────────────────────────────────
  const saveCletter = async () => {
    if (!clTitle.trim()) {
      toast.error(t('coverLetterTitleRequired'))
      return
    }
    setClSaving(true)
    try {
      if (clEditTarget) {
        await blink.db.coverLetters.update(clEditTarget.id, {
          title: clTitle.trim(),
          content: clContent,
          updatedAt: Date.now(),
        })
        setCoverLetters(prev =>
          prev.map(cl =>
            cl.id === clEditTarget.id
              ? { ...cl, title: clTitle.trim(), content: clContent }
              : cl
          )
        )
        toast.success(t('coverLetterUpdated'))
      } else {
        const created = await blink.db.coverLetters.create({
          id: crypto.randomUUID(),
          userId: user.id,
          title: clTitle.trim(),
          content: clContent,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }) as unknown as CoverLetter
        setCoverLetters(prev => [created, ...prev])
        toast.success(t('coverLetterSaved'))
      }
      closeCl()
    } catch {
      toast.error(t('coverLetterSaveFailed'))
    } finally {
      setClSaving(false)
    }
  }

  // ── Cover Letters: delete ─────────────────────────────────────────────────
  const deleteCl = async (id: string) => {
    try {
      await blink.db.coverLetters.delete(id)
      setCoverLetters(prev => prev.filter(cl => cl.id !== id))
      toast.success(t('coverLetterDeleted'))
    } catch {
      toast.error(t('coverLetterDeleteFailed'))
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">

      {/* ── Section A: CV Files ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck size={18} className="text-primary" />
            {t('cvFiles')}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="shrink-0"
          >
            {uploading
              ? <><Loader2 size={15} className="animate-spin mr-1" /> {t('uploading')}</>
              : <><Upload size={15} className="mr-1" /> {t('uploadCv')}</>
            }
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardHeader>

        <CardContent>
          {cvLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 size={20} className="animate-spin mr-2" /> {t('loading')}
            </div>
          ) : cvFiles.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title={t('noCvFilesTitle')}
              description={t('noCvFilesDesc')}
            />
          ) : (
            <ul className="divide-y divide-border/40">
              {cvFiles.map(cv => (
                <li key={cv.id} className="flex items-center gap-3 py-3.5 group">
                  <FileText size={20} className="text-primary shrink-0" />

                  {/* Name / inline edit */}
                  <div className="flex-1 min-w-0">
                    {editingCvId === cv.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          autoFocus
                          value={editingCvName}
                          onChange={e => setEditingCvName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEditCv(cv.id)
                            if (e.key === 'Escape') setEditingCvId(null)
                          }}
                          className="h-7 text-sm py-0"
                        />
                        <Button size="sm" variant="default" className="h-7 px-2 text-xs" onClick={() => saveEditCv(cv.id)}>{t('save')}</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingCvId(null)}>{t('cancelBtn')}</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-medium text-sm truncate">{cv.name}</span>
                        <button
                          onClick={() => startEditCv(cv)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          aria-label={t('renameLabel')}
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{new Date(cv.createdAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{formatFileSize(cv.fileSize)}</span>
                    </div>
                  </div>

                  {/* Badge */}
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {fileTypeBadge(cv.fileType, cv.name)}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => window.open(cv.fileUrl, '_blank')}
                      title={t('downloadLabel')}
                    >
                      <Download size={15} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteCv(cv.id)}
                      title={t('deleteLabel')}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Section B: Cover Letters ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            {t('coverLetters')}
          </CardTitle>
          <Button size="sm" onClick={openNewCl} className="shrink-0">
            <Plus size={15} className="mr-1" /> {t('newCoverLetter')}
          </Button>
        </CardHeader>

        <CardContent>
          {clLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 size={20} className="animate-spin mr-2" /> {t('loading')}
            </div>
          ) : coverLetters.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title={t('noCoverLettersTitle')}
              description={t('noCoverLettersDesc')}
            />
          ) : (
            <ul className="divide-y divide-border/40">
              {coverLetters.map(cl => (
                <li key={cl.id} className="flex items-start gap-3 py-4 group">
                  <FileText size={18} className="text-primary shrink-0 mt-0.5" />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug truncate">{cl.title}</p>
                    {cl.content && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {cl.content.slice(0, 80)}{cl.content.length > 80 ? '…' : ''}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(cl.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditCl(cl)}
                      title={t('editLabel')}
                    >
                      <Edit2 size={15} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteCl(cl.id)}
                      title={t('deleteLabel')}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Cover Letter Dialog (new + edit) ── */}
      <Dialog open={clDialogOpen} onOpenChange={open => { if (!open) closeCl() }}>
        <DialogContent className="w-full mx-0 sm:mx-auto rounded-none sm:rounded-2xl max-w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {clEditTarget ? t('editCoverLetter') : t('newCoverLetter')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t('coverLetterTitleLabel')} <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder={t('coverLetterTitlePlaceholder')}
                value={clTitle}
                onChange={e => setClTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && saveCletter()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t('coverLetterContentLabel')}
              </label>
              <Textarea
                placeholder={t('coverLetterContentPlaceholder')}
                value={clContent}
                onChange={e => setClContent(e.target.value)}
                className="min-h-[160px] sm:min-h-[200px] resize-y"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeCl} disabled={clSaving}>
              {t('cancelBtn')}
            </Button>
            <Button onClick={saveCletter} disabled={clSaving}>
              {clSaving
                ? <><Loader2 size={14} className="animate-spin mr-1" /> {t('savingLabel')}</>
                : t('save')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
