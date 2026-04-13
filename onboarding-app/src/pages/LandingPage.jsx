import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Layers, BarChart3, Shield } from 'lucide-react'
import styles from './LandingPage.module.css'
import SplashScreen from '../components/SplashScreen'

export default function LandingPage() {
  const nav = useNavigate()
  const [splashDone, setSplashDone] = useState(false)

  return (
    <div className={styles.root}>
      {!splashDone && <SplashScreen subtitle="Smart Employee Onboarding" onDone={() => setSplashDone(true)} />}
      <div className={styles.grain} />

      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoMark} />
          <span>OnboardIQ</span>
        </div>
        <span className={styles.tagline}>Smart Employee Onboarding</span>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <p className={styles.eyebrow}>HRMS · Identity Spine</p>
          <h1 className={styles.title}>
            From offer letter<br />
            to Day 1 readiness.
          </h1>
          <p className={styles.subtitle}>
            A fully automated digital onboarding system — provisioning accounts,
            collecting documents, and keeping everyone on track.
          </p>
        </div>

        <div className={styles.cards}>
          <button className={`${styles.card} ${styles.cardPrimary}`} onClick={() => nav('/onboard')}>
            <div className={styles.cardIcon} style={{ background: 'var(--sage-light)', color: 'var(--sage-dark)' }}>
              <Layers size={22} />
            </div>
            <div className={styles.cardBody}>
              <h2>New Hire Portal</h2>
              <p>Complete your onboarding journey — submit documents, sign policies, and get Day 1 ready.</p>
            </div>
            <ArrowRight size={18} className={styles.cardArrow} />
          </button>

          <button className={`${styles.card} ${styles.cardSecondary}`} onClick={() => nav('/hr')}>
            <div className={styles.cardIcon} style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
              <BarChart3 size={22} />
            </div>
            <div className={styles.cardBody}>
              <h2>HR Admin Dashboard</h2>
              <p>Monitor onboarding pipelines, review documents, and manage new hire progress in real time.</p>
            </div>
            <ArrowRight size={18} className={styles.cardArrow} />
          </button>

        </div>

        <div className={styles.features}>
          {[
            { icon: '⚡', label: 'Auto-provisioned Cognito accounts' },
            { icon: '📄', label: 'Encrypted S3 document storage' },
            { icon: '🔁', label: 'Step Functions workflow engine' },
            { icon: '📬', label: '24h reminder emails via SES' },
          ].map(f => (
            <div key={f.label} className={styles.feature}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        <Shield size={13} />
        <span>All data encrypted at rest · ap-south-1 (Mumbai)</span>
      </footer>
    </div>
  )
}
