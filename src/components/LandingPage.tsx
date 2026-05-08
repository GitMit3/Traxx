import { Briefcase, FileText, Bell, Search, ArrowRight, CheckCircle, LayoutDashboard, Clock, TrendingUp, XCircle, Zap, Calendar } from 'lucide-react'
import { Button } from '@blinkdotnew/ui'
import { useLanguage } from '../lib/LanguageContext'

interface LandingPageProps {
  onLogin: () => void
  onSignup: () => void
}

// ─── Logo mark ───────────────────────────────────────────────────────────────

function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 16 L10 16 L14 9 L20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="16" r="2" fill="currentColor" />
      <circle cx="14" cy="9" r="2" fill="currentColor" />
      <circle cx="20" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" fill="none" opacity="0.65" />
    </svg>
  )
}

// ─── Progress Ring ─────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 64, stroke = 5 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="hsl(var(--primary))" strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

// ─── Hero Visual ──────────────────────────────────────────────────────────────
// A premium product visual: two layered panels — pipeline + stats

function HeroVisual() {
  const pipeline = [
    {
      label: 'Applied',
      color: 'border-amber-400/60 bg-amber-50/80 dark:bg-amber-950/30',
      labelColor: 'text-amber-700 dark:text-amber-400',
      dotColor: 'bg-amber-400',
      cards: [
        { company: 'Klarna', role: 'UX Designer', days: '2d ago' },
        { company: 'IKEA', role: 'Frontend Dev', days: '5d ago' },
        { company: 'Ericsson', role: 'Data Engineer', days: '1w ago' },
      ],
    },
    {
      label: 'Interviewing',
      color: 'border-primary/30 bg-primary/5',
      labelColor: 'text-primary',
      dotColor: 'bg-primary',
      cards: [
        { company: 'Spotify', role: 'Product Engineer', days: 'Today' },
        { company: 'Volvo Cars', role: 'UX Lead', days: '3d ago' },
      ],
    },
    {
      label: 'Offer',
      color: 'border-emerald-400/60 bg-emerald-50/80 dark:bg-emerald-950/30',
      labelColor: 'text-emerald-700 dark:text-emerald-400',
      dotColor: 'bg-emerald-500',
      cards: [
        { company: 'H&M Group', role: 'Product Manager', days: 'Yesterday' },
      ],
    },
  ]

  return (
    <div className="relative w-full select-none">
      {/* Ambient glow */}
      <div className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.10)_0%,transparent_70%)] pointer-events-none rounded-3xl" />

      {/* ── Main panel: pipeline ── */}
      <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl shadow-black/8 overflow-hidden">

        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary rounded-lg text-primary-foreground shadow shadow-primary/30">
              <LogoMark size={15} />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground">Traxx</span>
              <span className="ml-2 text-[10px] text-muted-foreground font-medium">My Applications</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1 items-center px-2.5 py-1 rounded-lg bg-muted/60 border border-border/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-muted-foreground">24 active</span>
            </div>
          </div>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-3 gap-0 divide-x divide-border/30 bg-muted/20">
          {pipeline.map((col) => (
            <div key={col.label} className="p-3 space-y-2 min-h-[260px]">
              {/* Column header */}
              <div className="flex items-center gap-1.5 mb-3">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${col.labelColor}`}>
                  {col.label}
                </span>
                <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {col.cards.length}
                </span>
              </div>
              {/* Cards */}
              {col.cards.map((card) => (
                <div
                  key={card.company}
                  className={`rounded-xl border p-2.5 shadow-sm ${col.color} transition-shadow`}
                >
                  <p className="text-[11px] font-bold text-foreground leading-snug truncate">{card.company}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{card.role}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Calendar size={9} className="text-muted-foreground/60 shrink-0" />
                    <span className="text-[9px] text-muted-foreground/70 font-medium">{card.days}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar: quick stats */}
        <div className="flex items-center divide-x divide-border/30 border-t border-border/30 bg-card">
          {[
            { icon: <Zap size={12} className="text-amber-500" />, label: '3 follow-ups due', urgent: true },
            { icon: <TrendingUp size={12} className="text-primary" />, label: '5 interviewing', urgent: false },
            { icon: <CheckCircle size={12} className="text-emerald-500" />, label: '1 offer received', urgent: false },
          ].map((item) => (
            <div key={item.label} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2">
              {item.icon}
              <span className={`text-[10px] font-semibold truncate ${item.urgent ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Floating stats card (top-right) ── */}
      <div className="absolute -top-5 -right-5 hidden lg:block">
        <div className="bg-card border border-border/60 rounded-2xl shadow-lg shadow-black/10 p-4 w-[148px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Progress</p>
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <ProgressRing pct={71} size={72} stroke={6} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-foreground">71%</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { label: 'Applied', pct: 100, cls: 'bg-amber-400' },
              { label: 'Interviews', pct: 58, cls: 'bg-primary' },
              { label: 'Offers', pct: 14, cls: 'bg-emerald-500' },
            ].map(b => (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] text-muted-foreground font-medium">{b.label}</span>
                  <span className="text-[9px] font-bold text-foreground">{b.pct}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${b.cls} rounded-full`} style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Floating follow-up alert (bottom-left) ── */}
      <div className="absolute -bottom-4 -left-5 hidden lg:flex items-center gap-2.5 bg-card border border-border/60 rounded-xl shadow-lg shadow-black/8 px-4 py-3">
        <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
          <Bell size={15} className="text-rose-500" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-foreground leading-none">Follow-up overdue</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Spotify · 2 days ago</p>
        </div>
      </div>
    </div>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  desc: string
  accent: string
}

function FeatureCard({ icon, title, desc, accent }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-border/50 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
        {icon}
      </div>
      <h3 className="font-bold text-base mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary rounded-xl text-primary-foreground shadow-md shadow-primary/25">
              <LogoMark size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">Traxx</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={onLogin} className="font-medium text-sm px-3 py-1.5">
              {t('landingNavLogin')}
            </Button>
            <Button size="sm" onClick={onSignup} className="font-semibold shadow-sm shadow-primary/20 text-sm px-3 py-1.5">
              {t('landingNavSignup')}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-0 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.09)_0%,transparent_65%)]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.06)_0%,transparent_65%)]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-14 lg:gap-20 items-center">

            {/* Left: text */}
            <div className="text-center lg:text-left space-y-7 lg:space-y-8">
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-bold tracking-tight leading-[1.08] text-foreground">
                {t('landingHeroHeadline')}
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t('landingHeroSubheadline')}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col gap-3 justify-center lg:justify-start pt-1">
                <Button
                  size="lg"
                  onClick={onSignup}
                  className="w-full h-14 sm:h-12 sm:w-auto sm:px-8 text-base font-semibold shadow-md shadow-primary/20 gap-2"
                >
                  {t('landingCtaSignup')}
                  <ArrowRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onLogin}
                  className="w-full h-14 sm:h-12 sm:w-auto sm:px-8 text-base font-medium border-border/60"
                >
                  {t('landingCtaLogin')}
                </Button>
              </div>

              {/* Tagline */}
              <p className="text-xs text-muted-foreground/60 tracking-wide">
                {t('appTagline')}
              </p>
            </div>

            {/* Right: visual */}
            <div className="w-full mx-auto lg:mx-0 px-4 sm:px-8 lg:px-0 pt-6 lg:pt-10 pb-8 lg:pb-10">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 border-y border-border/30 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-4">
              {t('landingFeaturesTitle')}
            </h2>
            <div className="w-12 h-1 bg-primary/40 rounded-full mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <FeatureCard
              icon={<Briefcase size={22} className="text-primary" />}
              title={t('landingFeature1Title')}
              desc={t('landingFeature1Desc')}
              accent="bg-primary/10"
            />
            <FeatureCard
              icon={<FileText size={22} className="text-amber-600" />}
              title={t('landingFeature2Title')}
              desc={t('landingFeature2Desc')}
              accent="bg-amber-500/10"
            />
            <FeatureCard
              icon={<Bell size={22} className="text-rose-600" />}
              title={t('landingFeature3Title')}
              desc={t('landingFeature3Desc')}
              accent="bg-rose-500/10"
            />
            <FeatureCard
              icon={<Search size={22} className="text-sky-600" />}
              title={t('landingFeature4Title')}
              desc={t('landingFeature4Desc')}
              accent="bg-sky-500/10"
            />
          </div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-6 sm:gap-10 text-center">
            {[
              { icon: <LayoutDashboard size={20} className="text-primary" />, value: '4 views', label: 'Dashboard, Applications, Follow-ups & more' },
              { icon: <Clock size={20} className="text-amber-500" />, value: '0 setup', label: 'No configuration needed' },
              { icon: <CheckCircle size={20} className="text-emerald-500" />, value: '100% free', label: 'No credit card, no hidden fees' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-2">
                <div className="mb-1">{stat.icon}</div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground leading-snug hidden sm:block">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-3 bg-white/15 rounded-2xl text-primary-foreground">
              <LogoMark size={32} />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground tracking-tight">
            {t('landingHeroHeadline')}
          </h2>
          <p className="text-primary-foreground/80 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
            {t('landingHeroSubheadline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              onClick={onSignup}
              className="h-12 px-8 text-base font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md gap-2"
            >
              {t('landingCtaSignup')}
              <ArrowRight size={16} />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={onLogin}
              className="h-12 px-8 text-base font-medium text-primary-foreground hover:bg-white/10 border border-white/20"
            >
              {t('landingCtaLogin')}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-background border-t border-border/30 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary rounded-lg text-primary-foreground">
                <LogoMark size={16} />
              </div>
              <div>
                <span className="font-bold text-sm text-foreground">Traxx</span>
                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">{t('landingFooterTagline')}</p>
              </div>
            </div>
            <div />
          </div>
          <div className="mt-6 pt-6 border-t border-border/20 text-center">
            <p className="text-[11px] text-muted-foreground/60">© {new Date().getFullYear()} Traxx</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
