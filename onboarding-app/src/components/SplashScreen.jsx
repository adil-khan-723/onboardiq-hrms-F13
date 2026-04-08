import { useEffect, useState } from 'react'
import styles from './SplashScreen.module.css'

export default function SplashScreen({ subtitle, onDone }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 1700)
    const doneTimer = setTimeout(() => onDone(), 2350)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  return (
    <div className={`${styles.splash} ${exiting ? styles.exiting : ''}`}>
      <div className={styles.mark} />
      <div className={styles.wordmark}>OnboardIQ</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      <div className={styles.loader}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
    </div>
  )
}
