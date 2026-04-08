import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Upload, User, FileText, Shield, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import styles from './NewHirePortal.module.css'
import { createEmployee, getUploadUrl, uploadToS3, submitPolicySignoff } from '../api'
import SplashScreen from '../components/SplashScreen'

const STAGES = [
  { id: 'profile',   label: 'Your Profile',    icon: User },
  { id: 'documents', label: 'Documents',        icon: FileText },
  { id: 'policy',    label: 'Policy Sign-off',  icon: Shield },
  { id: 'manager',   label: 'Manager Intro',    icon: Users },
  { id: 'complete',  label: 'All Done',         icon: CheckCircle2 },
]

const POLICIES = [
  'Code of Conduct & Ethics Policy',
  'Information Security & Data Privacy Policy',
  'Remote Work & Flexible Working Policy',
  'Anti-Harassment & Discrimination Policy',
  'IT Acceptable Use Policy',
]

function StageIndicator({ current }) {
  return (
    <div className={styles.stageTrack}>
      {STAGES.map((s, i) => {
        const Icon = s.icon
        const done = i < current
        const active = i === current
        return (
          <div key={s.id} className={styles.stageItem}>
            <div className={`${styles.stageCircle} ${done ? styles.done : active ? styles.active : ''}`}>
              {done ? <Check size={13} /> : <Icon size={14} />}
            </div>
            <span className={`${styles.stageLabel} ${active ? styles.activeLabel : ''}`}>{s.label}</span>
            {i < STAGES.length - 1 && (
              <div className={`${styles.stageLine} ${done ? styles.doneLine : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ProfileStep({ data, onChange }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <h2>Welcome! Let's get you set up.</h2>
        <p>We'll create your employee profile and provision your accounts.</p>
      </div>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>First Name</label>
          <input type="text" placeholder="Arjun" value={data.firstName} onChange={e => onChange('firstName', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>Last Name</label>
          <input type="text" placeholder="Sharma" value={data.lastName} onChange={e => onChange('lastName', e.target.value)} />
        </div>
        <div className={`${styles.formGroup} ${styles.full}`}>
          <label>Personal Email</label>
          <input type="email" placeholder="arjun.sharma@gmail.com" value={data.email} onChange={e => onChange('email', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>Phone Number</label>
          <input type="tel" placeholder="+91 98765 43210" value={data.phone} onChange={e => onChange('phone', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>Date of Joining</label>
          <input type="date" value={data.joiningDate} onChange={e => onChange('joiningDate', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>Department</label>
          <select value={data.department} onChange={e => onChange('department', e.target.value)}>
            <option value="">Select department</option>
            <option>Engineering</option>
            <option>Product</option>
            <option>Design</option>
            <option>Marketing</option>
            <option>Sales</option>
            <option>Finance</option>
            <option>HR & People</option>
            <option>Legal</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Role / Title</label>
          <input type="text" placeholder="Senior Software Engineer" value={data.role} onChange={e => onChange('role', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>Employment Type</label>
          <select value={data.employmentType} onChange={e => onChange('employmentType', e.target.value)}>
            <option value="">Select type</option>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
            <option>Intern</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function DocumentStep({ docs, onFileChange }) {
  const docTypes = [
    { key: 'idProof',       label: 'Government ID Proof',      hint: 'Aadhaar, PAN card, or Passport' },
    { key: 'degreeCert',    label: 'Degree Certificate',        hint: 'Highest qualification certificate' },
    { key: 'offerLetter',   label: 'Signed Offer Letter',       hint: 'The countersigned offer letter' },
  ]
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <h2>Upload your documents</h2>
        <p>All files are encrypted and stored securely in S3. Max 10 MB per file (PDF, JPG, PNG).</p>
      </div>
      <div className={styles.docGrid}>
        {docTypes.map(d => (
          <label key={d.key} className={`${styles.docCard} ${docs[d.key] ? styles.docUploaded : ''}`}>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
              onChange={e => onFileChange(d.key, e.target.files[0])} />
            <div className={styles.docIcon}>
              {docs[d.key] ? <Check size={20} /> : <Upload size={20} />}
            </div>
            <div className={styles.docInfo}>
              <strong>{d.label}</strong>
              <span>{docs[d.key] ? docs[d.key].name : d.hint}</span>
            </div>
            {docs[d.key] && (
              <span className="badge badge-complete">Uploaded</span>
            )}
          </label>
        ))}
      </div>
      <div className={styles.docNote}>
        <AlertCircle size={14} />
        <span>HR will be notified via SNS once all documents are verified.</span>
      </div>
    </div>
  )
}

function PolicyStep({ signed, onToggle }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <h2>Policy acknowledgements</h2>
        <p>Please read and acknowledge each company policy to proceed.</p>
      </div>
      <div className={styles.policyList}>
        {POLICIES.map((p, i) => (
          <label key={i} className={`${styles.policyItem} ${signed.includes(i) ? styles.policySigned : ''}`}>
            <input type="checkbox" className="sr-only"
              checked={signed.includes(i)} onChange={() => onToggle(i)} />
            <div className={`${styles.policyCheck} ${signed.includes(i) ? styles.policyCheckDone : ''}`}>
              {signed.includes(i) && <Check size={12} />}
            </div>
            <div className={styles.policyText}>
              <strong>{p}</strong>
              <span>I have read, understood, and agree to abide by this policy.</span>
            </div>
          </label>
        ))}
      </div>
      {signed.length > 0 && (
        <div className={styles.policyProgress}>
          <div className={styles.policyProgressBar} style={{ width: `${(signed.length / POLICIES.length) * 100}%` }} />
        </div>
      )}
      <p className={styles.policyCount}>{signed.length} of {POLICIES.length} policies acknowledged</p>
    </div>
  )
}

function ManagerStep({ data, onChange }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <h2>Meet your manager</h2>
        <p>Your reporting manager will be introduced via email. Add any questions you'd like to ask them on Day 1.</p>
      </div>
      <div className={styles.managerCard}>
        <div className={styles.managerAvatar}>
          <span>HR</span>
        </div>
        <div>
          <strong>Your Manager</strong>
          <p>Will be assigned based on your department</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Introduction email will be sent on your joining date</p>
        </div>
      </div>
      <div className={styles.formGroup} style={{ marginTop: 24 }}>
        <label>Questions for your manager (optional)</label>
        <textarea
          rows={4}
          placeholder="What does a typical first week look like? What are the team's current priorities?..."
          value={data.managerNote}
          onChange={e => onChange('managerNote', e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className={styles.introNote}>
        <div className={styles.introStep}>
          <div className={styles.introDot} style={{ background: 'var(--sage)' }} />
          <span>An introduction email will be sent to both you and your manager</span>
        </div>
        <div className={styles.introStep}>
          <div className={styles.introDot} style={{ background: 'var(--amber)' }} />
          <span>IT equipment will be provisioned based on your role</span>
        </div>
        <div className={styles.introStep}>
          <div className={styles.introDot} style={{ background: 'var(--blue)' }} />
          <span>Temporary login credentials will arrive in your personal email</span>
        </div>
      </div>
    </div>
  )
}

function CompleteStep({ profile, onHome }) {
  return (
    <div className={`${styles.stepContent} ${styles.completeStep}`}>
      <div className={styles.completeIcon}>
        <CheckCircle2 size={40} color="var(--sage)" />
      </div>
      <h2>You're all set, {profile.firstName || 'there'}! 🎉</h2>
      <p>Your onboarding is complete. Here's what happens next:</p>
      <div className={styles.nextSteps}>
        {[
          { label: 'Employee record created', status: 'complete' },
          { label: 'Onboarding workflow started', status: 'complete' },
          { label: 'Documents submitted for HR review', status: 'progress' },
          { label: 'IT provisioning & credentials — check your email', status: 'progress' },
          { label: 'Manager introduction email on joining date', status: 'pending' },
        ].map((s, i) => (
          <div key={i} className={styles.nextItem}>
            <span className={`badge badge-${s.status}`}>
              {s.status === 'complete' ? '✓ Done' : s.status === 'progress' ? '↻ In progress' : '○ Pending'}
            </span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <p className={styles.completeNote}>Check your email for your temporary credentials and Day 1 schedule.</p>
      <button className={styles.btnPrimary} onClick={onHome} style={{ marginTop: 24 }}>
        <ArrowLeft size={15} /> Back to Home
      </button>
    </div>
  )
}

export default function NewHirePortal() {
  const nav = useNavigate()
  const [splashDone, setSplashDone] = useState(false)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    joiningDate: '', department: '', role: '', employmentType: '', managerNote: '',
  })
  const [docs, setDocs] = useState({ idProof: null, degreeCert: null, offerLetter: null })
  const [signed, setSigned] = useState([])

  const updateProfile = (k, v) => setProfile(p => ({ ...p, [k]: v }))
  const updateDoc = (k, f) => setDocs(d => ({ ...d, [k]: f }))
  const togglePolicy = (i) => setSigned(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])

  const canNext = () => {
    if (step === 0) return profile.firstName && profile.email && profile.department && profile.role
    if (step === 1) return docs.idProof && docs.degreeCert && docs.offerLetter
    if (step === 2) return signed.length === POLICIES.length
    return true
  }

  const [employeeId, setEmployeeId] = useState(null)
  const [error, setError] = useState(null)

  const handleNext = async () => {
    setError(null)
    // Step 0 — create employee record first
    if (step === 0) {
      setSubmitting(true)
      try {
        const result = await createEmployee({
          firstName: profile.firstName, lastName: profile.lastName,
          email: profile.email, phone: profile.phone,
          department: profile.department, role: profile.role,
          employmentType: profile.employmentType, joiningDate: profile.joiningDate,
        })
        setEmployeeId(result.employeeId)
      } catch (err) {
        setError('Submission failed: ' + err.message)
        setSubmitting(false)
        return
      }
      setSubmitting(false)
    }
    // Step 1 — upload documents to S3
    if (step === 1) {
      if (!employeeId) { setError('Profile not submitted yet'); return }
      setSubmitting(true)
      try {
        const empId = employeeId
        const DOC_MAP = { idProof: 'ID_PROOF', degreeCert: 'DEGREE_CERTIFICATE', offerLetter: 'OFFER_LETTER' }
        for (const [key, docType] of Object.entries(DOC_MAP)) {
          if (docs[key]) {
            const { uploadUrl } = await getUploadUrl(empId, {
              docType, fileName: docs[key].name,
              contentType: docs[key].type, fileSize: docs[key].size,
            })
            await uploadToS3(uploadUrl, docs[key])
          }
        }
      } catch (err) {
        setError('Document upload failed: ' + err.message)
        setSubmitting(false)
        return
      }
      setSubmitting(false)
    }
    // Step 2 — record policy sign-off in DynamoDB before advancing
    if (step === 2) {
      if (!employeeId) { setError('Profile not submitted yet'); return }
      setSubmitting(true)
      try {
        await submitPolicySignoff(employeeId)
      } catch (err) {
        setError('Policy sign-off failed: ' + err.message)
        setSubmitting(false)
        return
      }
      setSubmitting(false)
    }

    setStep(s => s + 1)
  }

  return (
    <div className={styles.root}>
      {!splashDone && <SplashScreen subtitle="New Hire Portal" onDone={() => setSplashDone(true)} />}
      <div className={styles.grain} />

      <header className={styles.header}>
        <button className={styles.back} onClick={() => step > 0 ? setStep(s => s - 1) : nav('/')}>
          <ArrowLeft size={16} />
          {step === 0 ? 'Home' : 'Back'}
        </button>
        <div className={styles.logo}>
          <div className={styles.logoMark} />
          <span>OnboardIQ</span>
        </div>
        <span className={styles.stepCount}>{step < 4 ? `Step ${step + 1} of 4` : 'Complete'}</span>
      </header>

      <div className={styles.container}>
        <StageIndicator current={step} />

        <div className={styles.card}>
          <div className={styles.cardInner}>
            {step === 0 && <ProfileStep data={profile} onChange={updateProfile} />}
            {step === 1 && <DocumentStep docs={docs} onFileChange={updateDoc} />}
            {step === 2 && <PolicyStep signed={signed} onToggle={togglePolicy} />}
            {step === 3 && <ManagerStep data={profile} onChange={updateProfile} />}
            {step === 4 && <CompleteStep profile={profile} onHome={() => nav('/')} />}
          </div>

          {step < 4 && (
            <div className={styles.cardFooter}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${(step / 4) * 100}%` }} />
              </div>
              {error && (
                <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 8 }}>{error}</p>
              )}
              <div className={styles.footerActions}>
                {step > 0 && (
                  <button className={styles.btnSecondary} onClick={() => setStep(s => s - 1)}>
                    <ArrowLeft size={15} /> Previous
                  </button>
                )}
                <button
                  className={styles.btnPrimary}
                  onClick={handleNext}
                  disabled={!canNext() || submitting}
                >
                  {submitting ? (
                    <><Loader2 size={15} className={styles.spin} /> Submitting...</>
                  ) : step === 3 ? (
                    <>Submit & Complete <Check size={15} /></>
                  ) : (
                    <>Continue <ArrowRight size={15} /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
