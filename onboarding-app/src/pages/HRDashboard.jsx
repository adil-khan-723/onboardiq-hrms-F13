import { useState, useEffect } from 'react'
import SplashScreen from '../components/SplashScreen'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Filter, Bell, ChevronDown, ChevronRight, FileCheck, Clock, AlertTriangle, CheckCircle2, User, RefreshCw, Download, Eye, Mail, Lock } from 'lucide-react'
import styles from './HRDashboard.module.css'
import { listEmployees } from '../api'

const MOCK_EMPLOYEES = [
  {
    id: 'EMP-0001',
    name: 'Arjun Sharma',
    role: 'Senior Software Engineer',
    department: 'Engineering',
    joiningDate: '2025-08-15',
    status: 'in_progress',
    stages: [
      { name: 'Document Collection', status: 'complete', completedAt: '2025-08-01' },
      { name: 'IT Provisioning',     status: 'complete', completedAt: '2025-08-02' },
      { name: 'Policy Sign-off',     status: 'in_progress', completedAt: null },
      { name: 'Manager Intro',       status: 'pending',    completedAt: null },
    ],
    documents: { idProof: true, degreeCert: true, offerLetter: false },
    email: 'arjun.sharma@gmail.com',
  },
  {
    id: 'EMP-0002',
    name: 'Meera Iyer',
    role: 'Product Manager',
    department: 'Product',
    joiningDate: '2025-08-18',
    status: 'complete',
    stages: [
      { name: 'Document Collection', status: 'complete', completedAt: '2025-08-03' },
      { name: 'IT Provisioning',     status: 'complete', completedAt: '2025-08-04' },
      { name: 'Policy Sign-off',     status: 'complete', completedAt: '2025-08-05' },
      { name: 'Manager Intro',       status: 'complete', completedAt: '2025-08-06' },
    ],
    documents: { idProof: true, degreeCert: true, offerLetter: true },
    email: 'meera.iyer@gmail.com',
  },
  {
    id: 'EMP-0003',
    name: 'Rohan Pillai',
    role: 'UX Designer',
    department: 'Design',
    joiningDate: '2025-08-22',
    status: 'pending',
    stages: [
      { name: 'Document Collection', status: 'pending', completedAt: null },
      { name: 'IT Provisioning',     status: 'pending', completedAt: null },
      { name: 'Policy Sign-off',     status: 'pending', completedAt: null },
      { name: 'Manager Intro',       status: 'pending', completedAt: null },
    ],
    documents: { idProof: false, degreeCert: false, offerLetter: false },
    email: 'rohan.pillai@gmail.com',
  },
  {
    id: 'EMP-0004',
    name: 'Anika Verma',
    role: 'Data Analyst',
    department: 'Finance',
    joiningDate: '2025-08-20',
    status: 'in_progress',
    stages: [
      { name: 'Document Collection', status: 'complete',    completedAt: '2025-08-07' },
      { name: 'IT Provisioning',     status: 'in_progress', completedAt: null },
      { name: 'Policy Sign-off',     status: 'pending',     completedAt: null },
      { name: 'Manager Intro',       status: 'pending',     completedAt: null },
    ],
    documents: { idProof: true, degreeCert: true, offerLetter: true },
    email: 'anika.verma@gmail.com',
  },
  {
    id: 'EMP-0005',
    name: 'Karan Mehta',
    role: 'Sales Executive',
    department: 'Sales',
    joiningDate: '2025-09-01',
    status: 'pending',
    stages: [
      { name: 'Document Collection', status: 'pending', completedAt: null },
      { name: 'IT Provisioning',     status: 'pending', completedAt: null },
      { name: 'Policy Sign-off',     status: 'pending', completedAt: null },
      { name: 'Manager Intro',       status: 'pending', completedAt: null },
    ],
    documents: { idProof: false, degreeCert: false, offerLetter: true },
    email: 'karan.mehta@gmail.com',
  },
]

const STATUS_MAP = {
  complete:    { label: 'Complete',    cls: 'badge-complete', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', cls: 'badge-progress', icon: RefreshCw },
  pending:     { label: 'Not Started', cls: 'badge-pending',  icon: Clock },
}

function StatsBar({ employees }) {
  const total = employees.length
  const complete = employees.filter(e => e.status === 'complete').length
  const inProgress = employees.filter(e => e.status === 'in_progress').length
  const pending = employees.filter(e => e.status === 'pending').length
  const docIssues = employees.filter(e => !e.documents.idProof || !e.documents.degreeCert || !e.documents.offerLetter).length

  return (
    <div className={styles.statsBar}>
      {[
        { label: 'Total Hires',    value: total,      color: 'var(--text-primary)' },
        { label: 'Complete',       value: complete,   color: 'var(--sage-dark)' },
        { label: 'In Progress',    value: inProgress, color: 'var(--amber)' },
        { label: 'Not Started',    value: pending,    color: 'var(--text-muted)' },
        { label: 'Doc Issues',     value: docIssues,  color: 'var(--coral)' },
      ].map(s => (
        <div key={s.label} className={styles.statCard}>
          <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
          <span className={styles.statLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

function MiniProgress({ stages }) {
  const done = stages.filter(s => s.status === 'complete').length
  const pct = (done / stages.length) * 100
  return (
    <div className={styles.miniProgress}>
      <div className={styles.miniBar}>
        {stages.map((s, i) => (
          <div key={i} className={`${styles.miniSegment} ${styles['seg_' + s.status]}`} />
        ))}
      </div>
      <span className={styles.miniCount}>{done}/{stages.length}</span>
    </div>
  )
}

function EmployeeRow({ emp, onSelect, selected, onReminder, onViewProfile, onExport }) {
  const sm = STATUS_MAP[emp.status]
  const Icon = sm.icon
  const docsComplete = emp.documents.idProof && emp.documents.degreeCert && emp.documents.offerLetter
  const days = Math.ceil((new Date(emp.joiningDate) - new Date()) / 86400000)

  return (
    <>
      <tr className={`${styles.row} ${selected ? styles.rowSelected : ''}`} onClick={() => onSelect(emp.id)}>
        <td className={styles.tdName}>
          <div className={styles.avatar}>{emp.name.split(' ').map(n => n[0]).join('')}</div>
          <div>
            <div className={styles.empName}>{emp.name}</div>
            <div className={styles.empMeta}>{emp.id} · {emp.department}</div>
          </div>
        </td>
        <td className={styles.tdRole}>{emp.role}</td>
        <td className={styles.tdJoin}>
          <span style={{ color: days < 7 ? 'var(--coral)' : days < 14 ? 'var(--amber)' : 'var(--text-secondary)' }}>
            {days > 0 ? `in ${days}d` : days === 0 ? 'Today!' : `${Math.abs(days)}d ago`}
          </span>
        </td>
        <td className={styles.tdProgress}><MiniProgress stages={emp.stages} /></td>
        <td>
          <span className={`badge ${sm.cls}`}>
            <Icon size={10} />
            {sm.label}
          </span>
        </td>
        <td className={styles.tdDocs}>
          {docsComplete
            ? <span className="badge badge-complete"><FileCheck size={10} /> Verified</span>
            : <span className="badge badge-error"><AlertTriangle size={10} /> Missing</span>
          }
        </td>
        <td>
          <ChevronRight size={14} color="var(--text-muted)" style={{ transform: selected ? 'rotate(90deg)' : 'none', transition: 'var(--transition)' }} />
        </td>
      </tr>

      {selected && (
        <tr className={styles.detailRow}>
          <td colSpan={7}>
            <div className={styles.detailPanel}>
              <div className={styles.detailLeft}>
                <p className={styles.detailTitle}>Onboarding Stages</p>
                <div className={styles.stagesDetail}>
                  {emp.stages.map((s, i) => (
                    <div key={i} className={styles.stageDetailItem}>
                      <div className={`${styles.stageDot} ${styles['dot_' + s.status]}`} />
                      <div className={styles.stageDetailText}>
                        <strong>{s.name}</strong>
                        <span>
                          {s.status === 'complete' ? `Done · ${s.completedAt}`
                           : s.status === 'in_progress' ? 'In progress'
                           : 'Not started yet'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.detailRight}>
                <p className={styles.detailTitle}>Documents</p>
                <div className={styles.docList}>
                  {[
                    { key: 'idProof',     label: 'Government ID' },
                    { key: 'degreeCert',  label: 'Degree Certificate' },
                    { key: 'offerLetter', label: 'Signed Offer Letter' },
                  ].map(d => (
                    <div key={d.key} className={styles.docItem}>
                      {emp.documents[d.key]
                        ? <CheckCircle2 size={14} color="var(--sage)" />
                        : <AlertTriangle size={14} color="var(--coral)" />}
                      <span style={{ color: emp.documents[d.key] ? 'var(--text-secondary)' : 'var(--coral)' }}>
                        {d.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={styles.detailActions}>
                  <button className={styles.actionBtn} onClick={() => onReminder(emp)}><Mail size={13} /> Send Reminder</button>
                  <button className={styles.actionBtn} onClick={() => onViewProfile(emp)}><Eye size={13} /> View Profile</button>
                  <button className={styles.actionBtn} onClick={() => onExport(emp)}><Download size={13} /> Export</button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

const HR_PIN = '1234'

function PinGate({ onUnlock }) {
  const nav = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [exiting, setExiting] = useState(false)

  const unlock = () => {
    setExiting(true)
    setTimeout(onUnlock, 560)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (pin === HR_PIN) {
      unlock()
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', opacity: exiting ? 0 : 1, transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1)', pointerEvents: exiting ? 'none' : 'all' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 40, width: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--amber-light)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Lock size={22} />
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600 }}>HR Access Only</h2>
        <p style={{ margin: '0 0 28px', color: 'var(--text-muted)', fontSize: 14 }}>Enter your HR PIN to continue.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            placeholder="Enter PIN"
            value={pin}
            onChange={e => {
              const val = e.target.value
              setPin(val)
              setError(false)
              if (val === HR_PIN) unlock()
            }}
            autoFocus
            style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${error ? 'var(--coral)' : 'var(--border)'}`, fontSize: 18, textAlign: 'center', letterSpacing: 8, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
          />
          {error && <p style={{ color: 'var(--coral)', fontSize: 13, margin: '8px 0 0' }}>Incorrect PIN. Try again.</p>}
          <button type="submit" style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'var(--sage)', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            Unlock Dashboard
          </button>
        </form>
        <button onClick={() => nav('/')} style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          ← Back to Home
        </button>
      </div>
    </div>
  )
}

export default function HRDashboard() {
  const nav = useNavigate()
  const [splashDone, setSplashDone] = useState(false)
  const [pinAuth, setPinAuth] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [allEmployees, setAllEmployees] = useState(MOCK_EMPLOYEES)
  const [loading, setLoading] = useState(true)
  const [profileModal, setProfileModal] = useState(null)
  const [reminderStatus, setReminderStatus] = useState({})

  const handleReminder = (emp) => {
    setReminderStatus(s => ({ ...s, [emp.id]: 'sent' }))
    alert(`Reminder queued for ${emp.name} (${emp.email}). They will be notified at the next Step Functions cycle.`)
  }

  const handleViewProfile = (emp) => setProfileModal(emp)

  const handleExport = (emp) => {
    const rows = [
      ['Field', 'Value'],
      ['Employee ID', emp.id],
      ['Name', emp.name],
      ['Role', emp.role],
      ['Department', emp.department],
      ['Email', emp.email],
      ['Joining Date', emp.joiningDate],
      ['Status', emp.status],
      ['ID Proof', emp.documents.idProof ? 'Uploaded' : 'Missing'],
      ['Degree Certificate', emp.documents.degreeCert ? 'Uploaded' : 'Missing'],
      ['Offer Letter', emp.documents.offerLetter ? 'Uploaded' : 'Missing'],
      ...emp.stages.map(s => [s.name, s.status]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${emp.id}-${emp.name.replace(' ', '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const data = await listEmployees()
      if (data && data.length > 0) {
        // Normalize API response to match component shape
        const normalized = data.map(e => ({
          id: e.employee_id,
          name: e.full_name,
          role: e.role,
          department: e.department,
          joiningDate: e.joining_date,
          status: (() => { const s = (e.workflow?.overall_status || 'NOT_STARTED').toLowerCase(); return s === 'not_started' ? 'pending' : s })(),
          stages: (e.stages || []).map(s => ({
            name: s.stage_name.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            status: s.status.toLowerCase(),
            completedAt: s.completed_at,
          })),
          documents: {
            idProof: e.documents?.some(d => d.doc_type === 'ID_PROOF' && d.status === 'UPLOADED'),
            degreeCert: e.documents?.some(d => d.doc_type === 'DEGREE_CERTIFICATE' && d.status === 'UPLOADED'),
            offerLetter: e.documents?.some(d => d.doc_type === 'OFFER_LETTER' && d.status === 'UPLOADED'),
          },
          email: e.email,
        }))
        setAllEmployees(normalized)
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchEmployees() }, [])

  const employees = allEmployees.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) ||
                        e.department?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || e.status === filter
    return matchSearch && matchFilter
  })

  const toggleSelect = (id) => setSelected(s => s === id ? null : id)

  if (!splashDone) return <SplashScreen subtitle="HR Admin" onDone={() => setSplashDone(true)} />
  if (!pinAuth) return <PinGate onUnlock={() => setPinAuth(true)} />

  return (
    <div className={styles.root}>
      <div className={styles.grain} />

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.back} onClick={() => nav('/')}>
            <ArrowLeft size={15} />
          </button>
          <div className={styles.logo}>
            <div className={styles.logoMark} />
            <div>
              <span className={styles.logoName}>OnboardIQ</span>
              <span className={styles.logoSub}>HR Admin</span>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} title="Notifications">
            <Bell size={16} />
            <span className={styles.notifDot} />
          </button>
          <div className={styles.adminAvatar}>HR</div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageHead}>
          <div>
            <h1>Onboarding Pipeline</h1>
            <p>Monitor and manage new hire onboarding across all stages.</p>
          </div>
          <button className={styles.refreshBtn} onClick={fetchEmployees} disabled={loading}>
            <RefreshCw size={14} className={loading ? styles.spin : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <StatsBar employees={allEmployees} />

        <div className={styles.tableCard}>
          <div className={styles.tableToolbar}>
            <div className={styles.searchBox}>
              <Search size={14} />
              <input
                type="text"
                placeholder="Search by name or department…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              {[
                { key: 'all',         label: 'All' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'complete',    label: 'Complete' },
                { key: 'pending',     label: 'Not Started' },
              ].map(f => (
                <button
                  key={f.key}
                  className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Joining</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Documents</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={7} className={styles.empty}>No employees match your search.</td></tr>
                ) : employees.map(emp => (
                  <EmployeeRow
                    key={emp.id}
                    emp={emp}
                    selected={selected === emp.id}
                    onSelect={toggleSelect}
                    onReminder={handleReminder}
                    onViewProfile={handleViewProfile}
                    onExport={handleExport}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFooter}>
            Showing {employees.length} of {allEmployees.length} employees
          </div>
        </div>

        {/* Profile Modal */}
        {profileModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => setProfileModal(null)}>
            <div style={{ background:'var(--bg-surface)', borderRadius:16, padding:32, width:480, maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--sage-mid)', color:'var(--sage-dark)', fontWeight:600, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {profileModal.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:500 }}>{profileModal.name}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)' }}>{profileModal.id} · {profileModal.department}</div>
                </div>
                <button onClick={() => setProfileModal(null)} style={{ marginLeft:'auto', background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text-muted)' }}>×</button>
              </div>
              <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
                {[
                  ['Role', profileModal.role],
                  ['Email', profileModal.email],
                  ['Department', profileModal.department],
                  ['Joining Date', profileModal.joiningDate || '—'],
                  ['Status', profileModal.status],
                  ['ID Proof', profileModal.documents.idProof ? '✓ Uploaded' : '✗ Missing'],
                  ['Degree Certificate', profileModal.documents.degreeCert ? '✓ Uploaded' : '✗ Missing'],
                  ['Offer Letter', profileModal.documents.offerLetter ? '✓ Uploaded' : '✗ Missing'],
                ].map(([k,v]) => (
                  <tr key={k} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px 0', color:'var(--text-muted)', width:140 }}>{k}</td>
                    <td style={{ padding:'10px 0', fontWeight:500 }}>{v}</td>
                  </tr>
                ))}
              </table>
              <div style={{ marginTop:20 }}>
                <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Onboarding Stages</div>
                {profileModal.stages.map((s,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, fontSize:13 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: s.status==='complete'?'var(--sage)':s.status==='in_progress'?'var(--amber)':'var(--border-mid)', flexShrink:0 }} />
                    <span style={{ flex:1 }}>{s.name}</span>
                    <span style={{ color:'var(--text-muted)' }}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Workflow legend */}
        <div className={styles.legend}>
          <span className={styles.legendTitle}>Stage status:</span>
          {[
            { cls: 'seg_complete',    label: 'Complete' },
            { cls: 'seg_in_progress', label: 'In Progress' },
            { cls: 'seg_pending',     label: 'Pending' },
          ].map(l => (
            <div key={l.label} className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles[l.cls]}`} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
