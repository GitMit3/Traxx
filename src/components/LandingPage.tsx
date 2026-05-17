import { ArrowRight, BookmarkPlus, Layers, BarChart2 } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

interface LandingPageProps {
  onLogin: () => void
  onSignup: () => void
}

function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14.5" y="14" width="3" height="16" rx="1.5" fill="currentColor"/>
      <path d="M4 18 C4 18 8 10 14.5 15.5 L17.5 15.5 C24 10 28 18 28 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

export function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  const { t } = useLanguage()

  const features = [
    {
      icon: <BookmarkPlus size={22} />,
      kicker: t('landingFeatureCaptureKicker'),
      title: t('landingFeatureCaptureTitle'),
      desc: t('landingFeatureCaptureDesc'),
    },
    {
      icon: <Layers size={22} />,
      kicker: t('landingFeatureMoveKicker'),
      title: t('landingFeatureMoveTitle'),
      desc: t('landingFeatureMoveDesc'),
    },
    {
      icon: <BarChart2 size={22} />,
      kicker: t('landingFeatureMeasureKicker'),
      title: t('landingFeatureMeasureTitle'),
      desc: t('landingFeatureMeasureDesc'),
    },
  ]

  return (
    <div className="dark min-h-screen relative text-white">

      {/* Fixed dark backdrop */}
      <div className="fixed inset-0 bg-[#07090f] -z-10" />
      {/* Hero radial glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] pointer-events-none -z-10"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(221 83% 38% / 0.38) 0%, transparent 68%)' }}
      />

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/[0.07]" style={{ background: 'rgba(7,9,15,0.72)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg text-white shadow-lg" style={{ background: '#1f4cb8', boxShadow: '0 0 12px hsl(221 83% 38% / 0.45)' }}>
              <LogoMark size={18} />
            </div>
            <span className="text-base font-bold tracking-tight">{t('appName')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onLogin}
              className="text-sm font-medium text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.07] transition-colors"
            >
              {t('landingNavLogin')}
            </button>
            <button
              onClick={onSignup}
              className="text-sm font-semibold text-white px-4 py-1.5 rounded-lg transition-all hover:-translate-y-px flex items-center gap-1.5 shadow-lg"
              style={{ background: '#1f4cb8', boxShadow: '0 0 16px hsl(221 83% 38% / 0.35)' }}
            >
              {t('landingNavSignup')}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-28 sm:pt-32 sm:pb-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center overflow-visible">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide mb-8"
            style={{ border: '1px solid hsl(199 89% 48% / 0.30)', background: 'hsl(199 89% 48% / 0.08)', color: 'hsl(199 89% 72%)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 6px hsl(199 89% 60%)' }} />
            {t('landingHeroBadge')}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight leading-snug py-4 mb-3">
            <span className="text-white">{t('landingHeroHeadlineLine1')}</span>
            <br />
            <span style={{ color: 'hsl(199 89% 68%)' }}>{t('landingHeroHeadlineLine2')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.50)' }}>
            {t('landingHeroSubheadline')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onSignup}
              className="h-12 px-8 text-sm font-semibold text-white rounded-xl transition-all hover:-translate-y-px flex items-center justify-center gap-2 shadow-xl"
              style={{ background: '#1f4cb8', boxShadow: '0 4px 24px hsl(221 83% 38% / 0.40)' }}
            >
              {t('landingCtaSignup')}
              <ArrowRight size={16} />
            </button>
            <button
              onClick={onLogin}
              className="h-12 px-8 text-sm font-medium rounded-xl transition-all hover:-translate-y-px flex items-center justify-center"
              style={{ border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.60)', background: 'rgba(255,255,255,0.03)' }}
            >
              {t('landingCtaLogin')}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {features.map(f => (
              <div
                key={f.title}
                className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="inline-flex p-2.5 rounded-xl mb-5"
                  style={{ background: 'hsl(221 83% 38% / 0.18)', border: '1px solid hsl(221 83% 55% / 0.20)', color: 'hsl(199 89% 68%)' }}
                >
                  {f.icon}
                </div>
                <p className="text-[10px] font-bold tracking-[0.18em] mb-2" style={{ color: 'hsl(199 89% 68%)' }}>
                  {f.kicker}
                </p>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 sm:py-36 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, hsl(221 83% 38% / 0.22) 0%, transparent 65%)' }}
        />
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div
            className="inline-flex p-3.5 rounded-2xl text-white mb-2"
            style={{ background: 'hsl(221 83% 38% / 0.18)', border: '1px solid hsl(221 83% 55% / 0.22)' }}
          >
            <LogoMark size={40} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t('landingFinalCtaTitle')}
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
            {t('landingFinalCtaSub')}
          </p>
          <button
            onClick={onSignup}
            className="h-12 px-10 text-sm font-semibold text-white rounded-xl transition-all hover:-translate-y-px inline-flex items-center gap-2 shadow-xl mt-2"
            style={{ background: '#1f4cb8', boxShadow: '0 4px 28px hsl(221 83% 38% / 0.42)' }}
          >
            {t('landingCtaSignup')}
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg text-white" style={{ background: 'rgba(31,76,184,0.50)' }}>
              <LogoMark size={16} />
            </div>
            <div>
              <span className="font-bold text-sm text-white">{t('appName')}</span>
              <p className="text-[11px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
                {t('landingFooterTagline')}
              </p>
            </div>
          </div>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} Traxx
          </p>
        </div>
      </footer>

    </div>
  )
}
