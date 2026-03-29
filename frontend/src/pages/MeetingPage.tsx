import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Play, CheckCircle, AlertTriangle, Send, Loader2, UserPlus, Users } from 'lucide-react'
import { meetingsApi, clientsApi, getAdvisorId } from '@/api'

import type { ClientProfile, TranscriptSegment, Recommendation, SentimentScore } from '@/types'
import TranscriptPanel from '@/components/meeting/TranscriptPanel'
import SentimentGauge from '@/components/meeting/SentimentGauge'
import RecommendationFeed from '@/components/meeting/RecommendationFeed'

type Stage = 'setup' | 'briefing' | 'active' | 'recommendations' | 'finalize' | 'create_client' | 'complete'

// Fields to capture and their advisor reminders for prospect meetings
const REQUIRED_FIELDS = [
  { key: 'first_name', label: 'First Name', reminder: 'Ask during intro: "And your name is…?"' },
  { key: 'last_name',  label: 'Last Name',  reminder: 'Confirm spelling when handing business card' },
  { key: 'email',      label: 'Email',      reminder: 'Offer meeting summary: "Best email to reach you?"' },
]
const HELPFUL_FIELDS = [
  { key: 'phone',           label: 'Phone',                 reminder: '"Best number for follow-up?"' },
  { key: 'aum',             label: 'Investable Assets',     reminder: '"Roughly how much are you looking to invest?"' },
  { key: 'annual_income',   label: 'Annual Income',         reminder: '"What range are you in for household income?"' },
  { key: 'age',             label: 'Age / Date of Birth',   reminder: 'Note age or DOB — drives time-horizon analysis' },
  { key: 'marital_status',  label: 'Marital Status',        reminder: '"Are you married? Any kids?" — triggers beneficiary & insurance talk' },
  { key: 'dependents',      label: 'Dependents',            reminder: '"Any kids or parents you\'re supporting?" — triggers education / LTC planning' },
  { key: 'employment',      label: 'Employment',            reminder: '"What do you do? Employee, self-employed, or retiring soon?"' },
  { key: 'retire_years',    label: 'Years to Retirement',   reminder: '"When are you hoping to retire?" — anchors time horizon' },
  { key: 'monthly_expenses',label: 'Monthly Expenses',      reminder: '"Roughly what does the household run per month?"' },
  { key: 'risk',            label: 'Risk Comfort',          reminder: '"How would you feel if your portfolio dropped 20% in a year?"' },
  { key: 'goals',           label: 'Primary Goal',          reminder: '"What are you mainly trying to accomplish — retirement, college, house?"' },
  { key: 'insurance',       label: 'Insurance in Place',    reminder: '"Do you have life / disability / LTC coverage?"' },
  { key: 'estate',          label: 'Will / Trust',          reminder: '"Do you have an estate plan, will, or trust on file?"' },
]

/** Real-time gap tracker — maps each capturable field to where it lives in extractedProfile. */
const CAPTURE_FIELDS = [
  // Personal
  { label: 'Full name',          section: 'Personal' as const,          required: true,  tip: 'Ask during intro',
    captured: (p: Record<string, unknown>) => !!((p.extracted_personal as Record<string,unknown>)?.name) },
  { label: 'Email',              section: 'Personal' as const,          required: true,  tip: '"Best email for follow-up?"',
    captured: (p: Record<string, unknown>) => {
      const ep = p.extracted_personal as Record<string, unknown> | undefined
      if (!ep) return false
      if (ep.email) return true
      const ci = ep.contact_info as Record<string, unknown> | undefined
      return !!(ci?.email)
    } },
  { label: 'Phone',              section: 'Personal' as const,          required: false, tip: '"Best number to reach you?"',
    captured: (p: Record<string, unknown>) => {
      const ep = p.extracted_personal as Record<string, unknown> | undefined
      if (!ep) return false
      if (ep.phone) return true
      const ci = ep.contact_info as Record<string, unknown> | undefined
      return !!(ci?.phone)
    } },
  { label: 'Age / DOB',          section: 'Personal' as const,          required: false, tip: 'Drives time-horizon analysis',
    captured: (p: Record<string, unknown>) => !!((p.extracted_personal as Record<string,unknown>)?.age) },
  { label: 'Marital status',     section: 'Personal' as const,          required: false, tip: '"Are you married? Any kids?"',
    captured: (p: Record<string, unknown>) => {
      const ep = p.extracted_personal as Record<string, unknown> | undefined
      return !!(ep?.marital_status || ep?.family_situation || ep?.family_status)
    } },
  { label: 'Occupation',         section: 'Personal' as const,          required: false, tip: '"What do you do professionally?"',
    captured: (p: Record<string, unknown>) => !!((p.extracted_personal as Record<string,unknown>)?.occupation) },
  // Financial
  { label: 'Annual income',      section: 'Financial' as const,         required: false, tip: '"Roughly what income range?"',
    captured: (p: Record<string, unknown>) => !!((p.extracted_financial as Record<string,unknown>)?.income) },
  { label: 'Investable assets',  section: 'Financial' as const,         required: true,  tip: '"How much are you looking to invest?"',
    captured: (p: Record<string, unknown>) => !!((p.extracted_financial as Record<string,unknown>)?.investable_assets) },
  { label: 'Existing holdings',  section: 'Financial' as const,         required: false, tip: '"Do you have existing investments?"',
    captured: (p: Record<string, unknown>) => !!((p.extracted_financial as Record<string,unknown>)?.existing_holdings) },
  { label: 'Monthly expenses',   section: 'Financial' as const,         required: false, tip: '"What does the household run per month?"',
    captured: (p: Record<string, unknown>) => {
      const ef = p.extracted_financial as Record<string, unknown> | undefined
      return !!(ef?.monthly_expenses || ef?.expenses || ef?.household_expenses || ef?.monthly_budget)
    } },
  // Risk & Goals
  { label: 'Risk tolerance',     section: 'Risk & Goals' as const,      required: true,  tip: '"How would you feel if portfolio dropped 25%?"',
    captured: (p: Record<string, unknown>) => !!((p.extracted_risk as Record<string,unknown>)?.tolerance_level) },
  { label: 'Time horizon',       section: 'Risk & Goals' as const,      required: false, tip: '"When do you want to hit your goal?"',
    captured: (p: Record<string, unknown>) => !!((p.extracted_risk as Record<string,unknown>)?.time_horizon) },
  { label: 'Financial goals',    section: 'Risk & Goals' as const,      required: true,  tip: '"What are you mainly trying to accomplish?"',
    captured: (p: Record<string, unknown>) => Array.isArray(p.extracted_goals) && (p.extracted_goals as unknown[]).length > 0 },
  // Insurance & Estate
  { label: 'Insurance coverage', section: 'Insurance & Estate' as const, required: false, tip: '"Life / disability / LTC coverage?"',
    captured: (p: Record<string, unknown>) => {
      const ins = p.extracted_insurance as Record<string,unknown> | undefined
      return !!(ins && Object.values(ins).some(v => v != null && v !== false && v !== ''))
    } },
  { label: 'Will or trust',      section: 'Insurance & Estate' as const, required: false, tip: '"Estate plan, will, or trust?"',
    captured: (p: Record<string, unknown>) => {
      const est = p.extracted_estate as Record<string,unknown> | undefined
      return !!(est && Object.values(est).some(v => v != null && v !== false && v !== ''))
    } },
]

const CAPTURE_SECTIONS = ['Personal', 'Financial', 'Risk & Goals', 'Insurance & Estate'] as const

const EXISTING_MEETING_TYPES = [
  'annual_review', 'portfolio_review', 'onboarding', 'adhoc', 'tax_planning',
]

type ClientForm = {
  first_name: string
  last_name: string
  email: string
  phone: string
  age: string
  marital_status: string
  number_of_dependents: string
  employment_status: string
  life_stage: string
  annual_income: string
  aum: string
  monthly_expenses: string
  years_to_retirement: string
  risk: string
  primary_goal: string
  has_life_insurance: boolean
  has_will: boolean
  has_trust: boolean
}

const emptyForm = (): ClientForm => ({
  first_name: '', last_name: '', email: '', phone: '',
  age: '', marital_status: 'single', number_of_dependents: '0',
  employment_status: 'employed', life_stage: 'accumulation',
  annual_income: '', aum: '', monthly_expenses: '', years_to_retirement: '',
  risk: 'moderate', primary_goal: 'retirement',
  has_life_insurance: false, has_will: false, has_trust: false,
})

/** Renders a key-value section of the extracted prospect profile. */
function ProfileSection({ title, fields }: { title: string; fields?: Record<string, unknown> }) {
  if (!fields || Object.keys(fields).length === 0) return null
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{title}</div>
      <dl className="space-y-0.5">
        {Object.entries(fields).map(([k, v]) => (
          v != null && v !== '' && (
            <div key={k} className="flex items-start gap-1.5 text-xs">
              <dt className="text-gray-500 shrink-0 capitalize" style={{ minWidth: '80px' }}>
                {k.replace(/_/g, ' ')}
              </dt>
              <dd className="text-gray-300 font-medium break-words">
                {typeof v === 'object'
                  ? Array.isArray(v)
                    ? (v as unknown[]).map(String).join(', ')
                    : Object.entries(v as Record<string, unknown>)
                        .filter(([, val]) => val != null && val !== '')
                        .map(([k, val]) => `${k.replace(/_/g, ' ')}: ${val}`)
                        .join('  ·  ')
                  : String(v)}
              </dd>
            </div>
          )
        ))}
      </dl>
    </div>
  )
}

export default function MeetingPage() {
  const [stage, setStage]               = useState<Stage>('setup')
  const [isProspect, setIsProspect]     = useState(false)
  const [clients, setClients]           = useState<ClientProfile[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [meetingType, setMeetingType]   = useState('annual_review')
  // session holds id + client_id returned by the backend start endpoint
  const [session, setSession]           = useState<Record<string, unknown> | null>(null)
  const [preBriefing, setPreBriefing]   = useState<Record<string, unknown> | null>(null)
  const [segments, setSegments]         = useState<TranscriptSegment[]>([])
  const [sentiment, setSentiment]       = useState<SentimentScore | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [transcriptInput, setTranscriptInput] = useState('')
  const [loading, setLoading]           = useState(false)
  const [approved, setApproved]         = useState<string[]>([])
  const [rejected, setRejected]         = useState<string[]>([])
  const [clientForm, setClientForm]     = useState<ClientForm>(emptyForm())
  const [creatingClient, setCreatingClient] = useState(false)
  const [createdClient, setCreatedClient]   = useState<string | null>(null)
  const [isRecording, setIsRecording]       = useState(false)
  const [micError, setMicError]             = useState<string | null>(null)
  const [extractedProfile, setExtractedProfile] = useState<Record<string, unknown>>({})
  const [autoCompleting, setAutoCompleting] = useState(false)
  const [completedSession, setCompletedSession] = useState<Record<string, unknown> | null>(null)
  const wsRef            = useRef<WebSocket | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => { clientsApi.list().then(setClients).catch(() => {}) }, [])
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [segments])

  useEffect(() => {
    const sid = session?.id as string | undefined
    if (!sid || stage !== 'active') return

    // `alive` prevents the StrictMode double-mount race:
    // cleanup fires ws.close() while ws is still CONNECTING → browser error.
    // Setting alive=false lets the onopen guard skip the stale instance.
    let alive = true
    const ws = new WebSocket(`ws://localhost:8000/api/meetings/${sid}/ws`)

    ws.onopen = () => {
      if (!alive) { ws.close(); return }
    }

    ws.onerror = () => { /* connection errors logged to console by browser */ }

    ws.onclose = (ev) => {
      if (!alive) return          // expected cleanup close — ignore
      if (ev.code !== 1000) {    // unexpected close (backend restart, network, etc.)
        setMicError('Connection to server lost. Please start a new meeting.')
        stopRecording()
      }
    }

    ws.onmessage = (e) => {
      if (!alive) return
      const msg = JSON.parse(e.data)
      if (msg.type === 'sentiment_update')      setSentiment(msg.data)
      if (msg.type === 'recommendations_ready') setRecommendations(msg.data)
      if (msg.type === 'meeting_completed')      setStage('complete')
      if (msg.type === 'profile_update')         setExtractedProfile(msg.data as Record<string, unknown>)
      if (msg.type === 'session_expired') {
        setMicError('Session expired (server restarted). Please start a new meeting.')
        stopRecording()
      }
      if (msg.type === 'transcript_segment') {
        const data = msg.data as Record<string, unknown>
        const text = (data?.text ?? data?.clean_text ?? '') as string
        if (text.trim()) {
          setSegments(p => [...p, {
            id: Date.now().toString(),
            speaker: (data?.speaker_hint === 'advisor' ? 'Advisor' : 'Client'),
            role: (data?.speaker_hint === 'advisor' ? 'advisor' : 'client') as 'advisor' | 'client',
            text: text.trim(),
            timestamp: new Date().toISOString(),
          }])
        }
      }
    }

    wsRef.current = ws
    return () => {
      alive = false
      ws.close()
    }
  }, [session?.id, stage])

  const startMeeting = async () => {
    if (!isProspect && !selectedClient) return
    setLoading(true)
    try {
      const s = await meetingsApi.start({
        client_id:      isProspect ? undefined : selectedClient,
        advisor_id:     getAdvisorId(),
        meeting_type:   isProspect ? 'prospecting' : meetingType,
        is_prospective: isProspect,
      })
      setSession(s)
      if (!isProspect && selectedClient) {
        const brief = await meetingsApi.preBriefing({
          client_id: selectedClient, advisor_id: getAdvisorId(), meeting_type: meetingType,
        }).catch(() => null)
        if (brief) setPreBriefing(brief as Record<string, unknown>)
        setStage('briefing')
      } else {
        setStage('active')
      }
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    if (!session) return
    try {
      setMicError(null)
      // AudioContext at 16 kHz + ScriptProcessorNode → Int16 PCM → HTTP POST /audio/stream.
      // Azure Speech SDK PushAudioInputStream expects 16000 Hz / 16-bit signed / mono.
      // Using HTTP POST (not WebSocket) avoids the readyState race — each chunk is
      // independent and fires immediately regardless of WS connection state.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      })
      const audioCtx = new AudioContext({ sampleRate: 16000 })
      const source = audioCtx.createMediaStreamSource(stream)
      // 4096 samples @ 16 kHz = 256 ms frames; the SDK accumulates until sentence boundary
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)

      const sessionId = session.id as string
      processor.onaudioprocess = (ev) => {
        if (!sessionId) return
        const float32 = ev.inputBuffer.getChannelData(0)
        const pcm = new Int16Array(float32.length)
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]))
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
        }
        const bytes = new Uint8Array(pcm.buffer)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
        fetch(`http://localhost:8000/api/meetings/${sessionId}/audio/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio_base64: btoa(binary), speaker_hint: 'client', session_id: sessionId }),
        }).catch(() => {}) // ignore per-chunk network errors
      }

      // Must connect to destination (even at gain=0) for ScriptProcessorNode to fire
      const gainNode = audioCtx.createGain()
      gainNode.gain.value = 0
      source.connect(processor)
      processor.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      // Store cleanup handles
      ;(mediaRecorderRef as React.MutableRefObject<unknown>).current =
        { audioCtx, processor, gainNode, source, stream }
      setIsRecording(true)
    } catch {
      setMicError('Microphone access denied. Use the text input below instead.')
    }
  }

  const stopRecording = () => {
    const rec = (mediaRecorderRef as React.MutableRefObject<{
      audioCtx: AudioContext
      processor: ScriptProcessorNode
      gainNode: GainNode
      source: MediaStreamAudioSourceNode
      stream: MediaStream
    } | null>).current
    if (rec) {
      rec.processor.disconnect()
      rec.gainNode.disconnect()
      rec.source.disconnect()
      rec.audioCtx.close()
      rec.stream.getTracks().forEach(t => t.stop())
      ;(mediaRecorderRef as React.MutableRefObject<unknown>).current = null
    }
    // Flush any remaining audio buffered in the SDK recognizer
    if (session) {
      fetch(`http://localhost:8000/api/meetings/${session.id as string}/audio/stream`, { method: 'DELETE' }).catch(() => {})
    }
    setIsRecording(false)
  }

  /**
   * Stop recording, then automatically run the full post-meeting pipeline:
   * recommendations → auto-approve → summarize (with action items) → persist to Cosmos.
   * All steps are correlated by session_id in the Cosmos audit trail.
   */
  const handleStopAndComplete = async () => {
    if (!session) return
    stopRecording()           // disconnect mic / audio context first
    setAutoCompleting(true)
    setMicError(null)
    try {
      const profile = Object.keys(extractedProfile).length ? extractedProfile : undefined
      const result = await meetingsApi.stopAndComplete(
        session.id as string,
        profile,
      ) as Record<string, unknown>
      setCompletedSession(result)
      if (result.is_prospective) {
        const serverExt = (result.profile_extractions ?? {}) as Record<string, unknown>
        const merged    = { ...serverExt, ...extractedProfile } as Record<string, unknown>
        _prefillFromExtraction(merged)
        // Auto-save: if it succeeds go straight to complete — no need to show the form.
        // Only fall back to the form if save fails (e.g. missing required fields).
        let autoSaved = false
        try {
          const saved = await meetingsApi.promoteToClient(session.id as string, { advisor_id: getAdvisorId() })
          setCreatedClient((saved.client_id ?? saved.id) as string ?? null)
          clientsApi.list().then(setClients)
          autoSaved = true
        } catch (e) {
          console.warn('auto-save partial profile failed — showing form for manual review', e)
        }
        setStage(autoSaved ? 'complete' : 'create_client')
      } else {
        const cid = session.client_id as string | undefined
        if (cid && !cid.startsWith('prospect-')) {
          try {
            await clientsApi.mergeProfile(cid, session.id as string)
          } catch (e) {
            console.warn('mergeProfile failed', e)
          }
        }
        setStage('complete')
      }
    } catch (e) {
      console.error('stop_and_complete failed:', e)
      setMicError('Pipeline failed — recommendations unavailable. Saving profile data…')
      // Still attempt client creation from already-extracted WebSocket data
      if (isProspect && Object.keys(extractedProfile).length > 0) {
        // Pre-fill the form from live WebSocket data so the advisor sees what was captured
        _prefillFromExtraction(extractedProfile)
        try {
          const saved = await meetingsApi.promoteToClient(session.id as string, { advisor_id: getAdvisorId() })
          setCreatedClient(((saved as Record<string, unknown>).client_id ?? (saved as Record<string, unknown>).id) as string ?? null)
          clientsApi.list().then(setClients)
          setStage('create_client')
        } catch (e2) {
          console.warn('partial profile save failed', e2)
        }
      }
    } finally {
      setAutoCompleting(false)
    }
  }

  const addTranscript = async () => {
    if (!session || !transcriptInput.trim()) return
    const seg: TranscriptSegment = {
      id: Date.now().toString(), speaker: 'Client', role: 'client',
      text: transcriptInput, timestamp: new Date().toISOString(),
    }
    setSegments(p => [...p, seg])
    setTranscriptInput('')
    await meetingsApi.addTranscript(session.id as string, seg.text, seg.role)
  }

  const generateRecommendations = async () => {
    if (!session) return
    setLoading(true)
    try {
      const result = await meetingsApi.recommend(session.id as string, Object.keys(extractedProfile).length ? extractedProfile : undefined) as Record<string, unknown>
      setRecommendations((result.recommendations as Recommendation[]) ?? [])
      setStage('recommendations')
    } finally { setLoading(false) }
  }

  const submitApprovals = async () => {
    if (!session) return
    setLoading(true)
    try {
      await meetingsApi.approveRecommendations(session.id as string, approved, rejected)
      setStage('finalize')
    } finally { setLoading(false) }
  }

  const finalizeMeeting = async () => {
    if (!session) return
    setLoading(true)
    try {
      await meetingsApi.finalize(session.id as string)
      const completeResult = await meetingsApi.complete(session.id as string)
      if (isProspect) {
        // Merge the live-updated extraction (from WS profile_update events)
        // with the finalized extraction stored in the completed session doc.
        // Live state wins on any key present in both.
        const serverExt = (completeResult.profile_extractions ?? {}) as Record<string, unknown>
        const merged    = { ...serverExt, ...extractedProfile } as Record<string, unknown>
        _prefillFromExtraction(merged)
        setStage('create_client')
      } else {
        // For existing clients: merge any newly-extracted goals/concerns/life_events
        // from this session back into their CRM profile automatically.
        const cid = session.client_id as string | undefined
        if (cid && !cid.startsWith('prospect-')) {
          try {
            await clientsApi.mergeProfile(cid, session.id as string)
          } catch (e) {
            // Non-fatal: meeting is still completed; merge can be retried
            console.warn('mergeProfile failed', e)
          }
        }
        setStage('complete')
      }
    } finally { setLoading(false) }
  }

  /** Helper: safely read a value from nested extraction or fall back through flat keys. */
  const _getExt = (
    ext: Record<string, unknown>,
    nested: string,
    ...flatKeys: string[]
  ): string => {
    const section = ext[nested] as Record<string, unknown> | undefined
    if (section) {
      for (const k of flatKeys) {
        const v = section[k]
        if (v != null && v !== '') return String(v)
      }
      // Also check one level deeper under contact_info / family_info sub-objects
      const subObjects = ['contact_info', 'family_info', 'personal_info']
      for (const sub of subObjects) {
        const subSection = section[sub] as Record<string, unknown> | undefined
        if (subSection) {
          for (const k of flatKeys) {
            const v = subSection[k]
            if (v != null && v !== '') return String(v)
          }
        }
      }
    }
    // Also try flat keys directly on ext (some agents return flat structure)
    for (const k of flatKeys) {
      const v = ext[k]
      if (v != null && v !== '') return String(v)
    }
    return ''
  }

  const _prefillFromExtraction = (ext: Record<string, unknown>) => {
    // personal section
    const fullName = _getExt(ext, 'extracted_personal', 'name', 'full_name')
    const nameParts = fullName.split(' ')
    const aiFirst  = _getExt(ext, 'extracted_personal', 'first_name') || nameParts[0] || ''
    const aiLast   = _getExt(ext, 'extracted_personal', 'last_name')  || nameParts.slice(1).join(' ') || ''

    // risk section
    const aiRisk = _getExt(ext, 'extracted_risk', 'tolerance', 'risk_tolerance',
      'investment_risk_tolerance') || 'moderate'

    // goals
    const goalsRaw = (ext.extracted_goals ?? []) as unknown[]
    const firstGoal = Array.isArray(goalsRaw) && goalsRaw.length
      ? String(goalsRaw[0]).toLowerCase()
      : ''
    let primaryGoal = 'retirement'
    if      (firstGoal.includes('educati'))  primaryGoal = 'education'
    else if (firstGoal.includes('home'))     primaryGoal = 'home_purchase'
    else if (firstGoal.includes('business')) primaryGoal = 'business_investment'
    else if (firstGoal.includes('income'))   primaryGoal = 'income_generation'
    else if (firstGoal.includes('estate'))   primaryGoal = 'estate_transfer'

    setClientForm({
      first_name:           aiFirst,
      last_name:            aiLast,
      email:                _getExt(ext, 'extracted_personal', 'email', 'email_address'),
      phone:                _getExt(ext, 'extracted_personal', 'phone', 'phone_number'),
      age:                  _getExt(ext, 'extracted_personal', 'age'),
      marital_status:       _getExt(ext, 'extracted_personal', 'marital_status') || 'single',
      number_of_dependents: _getExt(ext, 'extracted_personal', 'number_of_dependents', 'dependents') || '0',
      employment_status:    _getExt(ext, 'extracted_personal', 'employment_status', 'employment') || 'employed',
      life_stage:           _getExt(ext, 'extracted_personal', 'life_stage') || 'accumulation',
      annual_income:        _getExt(ext, 'extracted_financial', 'annual_income', 'income', 'salary'),
      aum:                  _getExt(ext, 'extracted_financial', 'investable_assets', 'aum', 'liquid_assets'),
      monthly_expenses:     _getExt(ext, 'extracted_financial', 'monthly_expenses', 'expenses'),
      years_to_retirement:  _getExt(ext, 'extracted_risk', 'years_to_retirement', 'time_horizon_years', 'investment_horizon_years'),
      risk:                 aiRisk,
      primary_goal:         primaryGoal,
      has_life_insurance:   _getExt(ext, 'extracted_insurance', 'has_life_insurance', 'life_insurance') === 'true' ||
                            Boolean((ext.extracted_insurance as Record<string, unknown> | undefined)?.has_life_insurance),
      has_will:             _getExt(ext, 'extracted_estate', 'has_will') === 'true' ||
                            Boolean((ext.extracted_estate as Record<string, unknown> | undefined)?.has_will),
      has_trust:            _getExt(ext, 'extracted_estate', 'has_trust', 'has_revocable_trust') === 'true' ||
                            Boolean((ext.extracted_estate as Record<string, unknown> | undefined)?.has_trust),
    })
  }

  const createAndLinkClient = async () => {
    if (!session) return
    setCreatingClient(true)
    try {
      // Use the promote-to-client endpoint — it merges AI extraction + form overrides
      // and handles all the nested field mapping server-side.
      const result = await meetingsApi.promoteToClient(session.id as string, {
        advisor_id:           getAdvisorId(),
        first_name:           clientForm.first_name,
        last_name:            clientForm.last_name,
        email:                clientForm.email,
        phone:                clientForm.phone,
        age:                  clientForm.age ? Number(clientForm.age) : null,
        marital_status:       clientForm.marital_status,
        number_of_dependents: Number(clientForm.number_of_dependents),
        employment_status:    clientForm.employment_status,
        life_stage:           clientForm.life_stage,
        annual_income:        clientForm.annual_income  ? Number(clientForm.annual_income)  : 0,
        investable_assets:    clientForm.aum            ? Number(clientForm.aum)            : 0,
        monthly_expenses:     clientForm.monthly_expenses ? Number(clientForm.monthly_expenses) : 0,
        years_to_retirement:  clientForm.years_to_retirement ? Number(clientForm.years_to_retirement) : null,
        risk_tolerance:       clientForm.risk,
        primary_goal_type:    clientForm.primary_goal,
        has_life_insurance:   clientForm.has_life_insurance,
        has_will:             clientForm.has_will,
        has_trust:            clientForm.has_trust,
      })
      setCreatedClient((result.client_id ?? result.id) as string ?? null)
      clientsApi.list().then(setClients)
      setStage('complete')
    } finally { setCreatingClient(false) }
  }

  /**
   * Mid-meeting quick-save: promote whatever has been extracted so far.
   * The form hasn't been shown yet — use extractedProfile directly.
   */
  const quickSaveProspect = async () => {
    if (!session || !isProspect) return
    setCreatingClient(true)
    try {
      const result = await meetingsApi.promoteToClient(session.id as string, {
        advisor_id: getAdvisorId(),
      })
      setCreatedClient((result.client_id ?? result.id) as string ?? null)
      clientsApi.list().then(setClients)
    } finally { setCreatingClient(false) }
  }

  const resetMeeting = () => {
    stopRecording()
    setStage('setup'); setSession(null); setSegments([]); setRecommendations([])
    setPreBriefing(null); setIsProspect(false); setSelectedClient('')
    setCreatedClient(null); setClientForm(emptyForm()); setApproved([]); setRejected([])
    setMicError(null); setExtractedProfile({}); setCompletedSession(null); setAutoCompleting(false)
  }

  const activeClient = clients.find(c => c.id === selectedClient)
  const missingRequired = REQUIRED_FIELDS.filter(f => !clientForm[f.key as keyof ClientForm])
  const missingHelpful  = HELPFUL_FIELDS.filter(f => !clientForm[f.key as keyof ClientForm])

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-100">Meeting Intelligence</h2>
        <p className="text-sm text-gray-500 mt-0.5">Real-time transcription · sentiment · compliance-checked recommendations</p>
      </div>

      {/* ── Setup ── */}
      {stage === 'setup' && (
        <div className="card max-w-lg space-y-5">
          <h3 className="text-sm font-semibold text-gray-200">Start New Meeting</h3>

          {/* Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsProspect(false)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-colors ${
                !isProspect ? 'bg-accent/10 border-accent/50 text-accent font-medium' : 'border-border text-gray-400 hover:border-gray-600'
              }`}
            >
              <Users size={15} /> Existing Client
            </button>
            <button
              onClick={() => { setIsProspect(true); setMeetingType('prospecting') }}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-colors ${
                isProspect ? 'bg-accent/10 border-accent/50 text-accent font-medium' : 'border-border text-gray-400 hover:border-gray-600'
              }`}
            >
              <UserPlus size={15} /> New Prospect
            </button>
          </div>

          {/* Existing: client dropdown + meeting type */}
          {!isProspect && (
            <>
              <div>
                <label className="section-title mb-1">Client</label>
                <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="input">
                  <option value="">Select a client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="section-title mb-1">Meeting Type</label>
                <select value={meetingType} onChange={e => setMeetingType(e.target.value)} className="input">
                  {EXISTING_MEETING_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Prospect: capture reminder card */}
          {isProspect && (
            <div className="rounded-xl bg-amber-900/20 border border-amber-700/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wide">
                <AlertTriangle size={13} /> Capture during the meeting
              </div>
              <div className="space-y-2">
                <div className="text-xs text-amber-300/70 font-medium uppercase tracking-wide">Required to create profile</div>
                {REQUIRED_FIELDS.map(f => (
                  <div key={f.key} className="flex items-start gap-2 text-xs text-amber-200/90">
                    <span className="text-red-400 font-bold shrink-0 w-3">*</span>
                    <span><span className="font-semibold">{f.label}:</span> {f.reminder}</span>
                  </div>
                ))}
                <div className="text-xs text-amber-300/50 font-medium uppercase tracking-wide pt-1">Also helpful</div>
                {HELPFUL_FIELDS.map(f => (
                  <div key={f.key} className="flex items-start gap-2 text-xs text-amber-200/60">
                    <span className="text-amber-600 shrink-0 w-3">·</span>
                    <span><span className="font-semibold">{f.label}:</span> {f.reminder}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startMeeting}
            disabled={(!isProspect && !selectedClient) || loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {isProspect ? 'Start Prospect Meeting' : 'Start Meeting'}
          </button>
        </div>
      )}

      {/* ── Pre-meeting briefing (existing clients only) ── */}
      {stage === 'briefing' && preBriefing && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200">
              Pre-Meeting Briefing — {activeClient?.first_name} {activeClient?.last_name}
            </h3>
            <button onClick={() => setStage('active')} className="btn-primary flex items-center gap-2">
              <Mic size={14} /> Begin Meeting
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'talking_points',    label: 'Talking Points' },
              { key: 'tax_opportunities', label: 'Tax Opportunities' },
              { key: 'relationship_ideas',label: 'Relationship Ideas' },
              { key: 'market_alerts',     label: 'Market Alerts' },
            ].map(({ key, label }) => {
              const items = (preBriefing[key] as string[]) ?? []
              return (
                <div key={key}>
                  <div className="section-title">{label}</div>
                  <ul className="space-y-1.5">
                    {items.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1 shrink-0" />
                        {item}
                      </li>
                    ))}
                    {items.length === 0 && <li className="text-xs text-gray-500">None detected</li>}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Active meeting ── */}
      {stage === 'active' && session && (
        <div className={`grid grid-cols-1 gap-5 ${isProspect ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          <div className="lg:col-span-2 card flex flex-col gap-4" style={{ maxHeight: 'calc(100vh - 13rem)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-400 animate-pulse' : 'bg-amber-500/70'}`} />
                <h3 className="text-sm font-semibold text-gray-200">Live Transcript</h3>
                {isRecording && <span className="badge-error text-[10px] px-1.5 animate-pulse">REC</span>}
                {isProspect && <span className="badge-warning text-[10px] px-1.5">Prospect</span>}
              </div>
              {/* Stop recording auto-completes the full pipeline */}
              {isRecording && (
                <button
                  onClick={handleStopAndComplete}
                  disabled={autoCompleting}
                  className="btn-primary flex items-center gap-2 text-xs bg-red-700/30 border-red-600/70 text-red-300 hover:bg-red-700/50"
                >
                  {autoCompleting ? <Loader2 size={12} className="animate-spin" /> : <MicOff size={12} />}
                  Stop &amp; Complete
                </button>
              )}
              {/* Manual fallback when not recording */}
              {!isRecording && segments.length >= 2 && (
                <button
                  onClick={generateRecommendations}
                  disabled={loading || autoCompleting}
                  className="btn-primary flex items-center gap-2 text-xs"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Generate Recommendations
                </button>
              )}
            </div>
            {/* Auto-complete progress overlay */}
            {autoCompleting && (
              <div className="flex items-center gap-3 rounded-xl bg-accent/10 border border-accent/30 px-4 py-3 text-sm text-accent animate-pulse">
                <Loader2 size={16} className="animate-spin shrink-0" />
                <span>Generating recommendations, summaries, and action items — logging to audit trail…</span>
              </div>
            )}
            {/* Mid-meeting prospect quick-save — available once profile has data */}
            {isProspect && Object.keys(extractedProfile).length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-900/20 border border-blue-700/40 px-3 py-2 text-xs">
                <UserPlus size={12} className="text-blue-400 shrink-0" />
                <span className="text-blue-300 flex-1">
                  Profile {Math.round(((extractedProfile.profile_completeness as number) ?? 0) * 100)}% captured —
                  save now or finish meeting to complete
                </span>
                <button
                  onClick={quickSaveProspect}
                  disabled={creatingClient}
                  className="ml-2 px-2.5 py-1 rounded-lg bg-blue-700/40 hover:bg-blue-600/50 text-blue-200 font-medium transition-colors"
                >
                  {creatingClient ? <Loader2 size={11} className="animate-spin inline" /> : 'Save Partial Profile'}
                </button>
              </div>
            )}

            {/* Persistent reminder bar for prospect meetings */}
            {isProspect && (
              <div className="rounded-lg bg-amber-900/20 border border-amber-700/40 p-2.5 flex items-center gap-2 text-xs text-amber-300 flex-wrap">
                <AlertTriangle size={12} className="shrink-0 text-amber-400" />
                <span>Capture: </span>
                <span className="text-red-300 font-semibold">name · email</span>
                <span className="text-amber-400/60">·</span>
                <span className="text-amber-200/70">phone · assets · income · family · risk · goals · insurance · estate</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0">
              <TranscriptPanel segments={segments} />
              <div ref={transcriptEndRef} />
            </div>
            {/* Mic toggle + text fallback */}
            <div className="flex gap-2">
              <button
                onClick={isRecording ? handleStopAndComplete : startRecording}
                disabled={autoCompleting}
                title={isRecording ? 'Stop recording and run full pipeline' : 'Start real-time audio transcription'}
                className={`flex items-center justify-center px-3 rounded-xl border text-sm font-medium transition-colors shrink-0 ${
                  isRecording
                    ? 'bg-red-700/30 border-red-600/70 text-red-400 hover:bg-red-700/50'
                    : 'border-border text-gray-400 hover:border-accent/50 hover:text-accent'
                }`}
              >
                {autoCompleting ? <Loader2 size={15} className="animate-spin" /> : isRecording ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
              <input
                value={transcriptInput}
                onChange={e => setTranscriptInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTranscript()}
                placeholder={isRecording ? 'Listening via mic… or type to add manually' : 'Type or paste transcript segment…'}
                className="input"
              />
              <button onClick={addTranscript} disabled={!transcriptInput.trim()} className="btn-primary px-3">
                <Send size={14} />
              </button>
            </div>
            {micError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle size={11} /> {micError}
              </p>
            )}
          </div>

          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 13rem)' }}>
            <div className="card">
              <div className="section-title mb-3">Live Sentiment</div>
              {sentiment ? (
                <div className="space-y-3">
                  <SentimentGauge value={sentiment.overall            ?? 0} label="Overall" />
                  <SentimentGauge value={sentiment.investment_readiness ?? 0} label="Readiness" />
                  <SentimentGauge value={sentiment.risk_appetite        ?? 0} label="Risk Appetite" />
                  <SentimentGauge value={sentiment.engagement           ?? 0} label="Engagement" />
                  {sentiment.compliance_flag && sentiment.compliance_flag !== 'none' && (
                    <div className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg ${sentiment.compliance_flag === 'critical' ? 'badge-error' : 'badge-warning'}`}>
                      <AlertTriangle size={12} /> Compliance {sentiment.compliance_flag} detected
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Waiting for sentiment data…</div>
              )}
            </div>

            {/* ── Real-time prospect schema panel ── */}
            {isProspect && (
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="section-title">Building Client Profile</div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
                    {Math.round(((extractedProfile.profile_completeness as number) ?? 0) * 100)}% complete
                  </span>
                </div>
                {/* Completeness bar */}
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-50)' }}>
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round(((extractedProfile.profile_completeness as number) ?? 0) * 100)}%`,
                      background: 'var(--color-accent)',
                    }}
                  />
                </div>

                {/* Personal */}
                <ProfileSection
                  title="Personal"
                  fields={extractedProfile.extracted_personal as Record<string, unknown> | undefined}
                />
                {/* Financial */}
                <ProfileSection
                  title="Financial"
                  fields={extractedProfile.extracted_financial as Record<string, unknown> | undefined}
                />
                {/* Risk */}
                <ProfileSection
                  title="Risk"
                  fields={extractedProfile.extracted_risk as Record<string, unknown> | undefined}
                />
                {/* Goals */}
                {Array.isArray(extractedProfile.extracted_goals) && (extractedProfile.extracted_goals as unknown[]).length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Goals</div>
                    <ul className="space-y-1">
                      {(extractedProfile.extracted_goals as string[]).map((g, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                          <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--color-accent)' }} />
                          {typeof g === 'object' ? JSON.stringify(g) : String(g)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Concerns */}
                {Array.isArray(extractedProfile.extracted_concerns) && (extractedProfile.extracted_concerns as unknown[]).length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Concerns</div>
                    <ul className="space-y-1">
                      {(extractedProfile.extracted_concerns as string[]).map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-amber-300/80">
                          <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                          {typeof c === 'object' ? JSON.stringify(c) : String(c)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Action items */}
                {Array.isArray(extractedProfile.key_action_items) && (extractedProfile.key_action_items as unknown[]).length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Action Items</div>
                    <ul className="space-y-1">
                      {(extractedProfile.key_action_items as string[]).map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                          <CheckCircle size={10} className="shrink-0 mt-0.5 text-green-400" />
                          {typeof a === 'object' ? JSON.stringify(a) : String(a)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Object.keys(extractedProfile).length === 0 && (
                  <p className="text-xs text-gray-600">Profile will populate as the conversation progresses…</p>
                )}
              </div>
            )}
          </div>

          {/* ── 3rd column: Profile Gaps ── */}
          {isProspect && (
            <div className="card space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 13rem)' }}>
              <div className="flex items-center justify-between">
                <div className="section-title">Profile Gaps</div>
                {Object.keys(extractedProfile).length > 0 && (
                  <span className="text-xs font-medium text-amber-400">
                    {CAPTURE_FIELDS.filter(f => !f.captured(extractedProfile)).length} left
                  </span>
                )}
              </div>

              {Object.keys(extractedProfile).length === 0 ? (
                <p className="text-xs text-gray-600">Start the conversation to track gaps…</p>
              ) : (
                <div className="space-y-3">
                  {CAPTURE_SECTIONS.map(section => {
                    const fields = CAPTURE_FIELDS.filter(f => f.section === section)
                    const done   = fields.filter(f =>  f.captured(extractedProfile))
                    const todo   = fields.filter(f => !f.captured(extractedProfile))
                    return (
                      <div key={section}>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1.5">
                          {section}
                          <span className="text-[9px] text-gray-600 font-normal normal-case tracking-normal">{done.length}/{fields.length}</span>
                        </div>
                        <ul className="space-y-1">
                          {done.map(f => (
                            <li key={f.label} className="flex items-center gap-1.5 text-[11px] text-green-500/60 line-through">
                              <CheckCircle size={9} className="shrink-0 no-underline" />
                              {f.label}
                            </li>
                          ))}
                          {todo.map(f => (
                            <li key={f.label} className="flex items-start gap-1.5 text-[11px]">
                              <AlertTriangle size={9} className={`shrink-0 mt-0.5 ${f.required ? 'text-red-400' : 'text-amber-400'}`} />
                              <div>
                                <span className={f.required ? 'text-red-300 font-medium' : 'text-amber-200/70'}>{f.label}</span>
                                <div className="text-[10px] text-gray-600 leading-tight mt-0.5">{f.tip}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Recommendations approval ── */}
      {stage === 'recommendations' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200">Recommendations — Human Review Required</h3>
            <button onClick={submitApprovals} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Submit ({approved.length} approved / {rejected.length} rejected)
            </button>
          </div>
          <RecommendationFeed
            recommendations={recommendations}
            onApprove={id => setApproved(p => [...p, id])}
            onReject={id => setRejected(p => [...p, id])}
          />
        </div>
      )}

      {/* ── Finalize ── */}
      {stage === 'finalize' && (
        <div className="card max-w-lg space-y-4">
          <h3 className="text-sm font-semibold text-gray-200">Finalize Meeting</h3>
          <p className="text-sm text-gray-400">
            {isProspect
              ? 'AI will extract prospect profile data from the transcript and pre-fill the client creation form.'
              : 'Generate AI summaries (advisor, client, compliance) and persist to CosmosDB.'}
          </p>
          <button onClick={finalizeMeeting} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            Finalize & Generate Summaries
          </button>
        </div>
      )}

      {/* ── Create client from prospect meeting ── */}
      {stage === 'create_client' && (
        <div className="max-w-2xl space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-100">Create Client from Meeting</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Fields below were pre-filled by AI from the transcript.
              Complete any missing <span className="text-red-400 font-medium">required</span> fields before saving.
            </p>
          </div>

          {/* Hard blocker: missing required fields */}
          {missingRequired.length > 0 && (
            <div className="rounded-xl bg-red-900/25 border border-red-800/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <AlertTriangle size={13} /> Still missing — fill in below or call back the prospect
              </div>
              {missingRequired.map(f => (
                <div key={f.key} className="flex items-start gap-2 text-xs text-red-300/90">
                  <span className="text-red-400 font-bold shrink-0">→</span>
                  <span><span className="font-medium">{f.label}:</span> {f.reminder}</span>
                </div>
              ))}
            </div>
          )}

          <div className="card space-y-5">
            {/* — Personal — */}
            <div>
              <div className="section-title text-accent mb-3">Personal</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="section-title">First Name <span className="text-red-400">*</span></label>
                  <input value={clientForm.first_name} onChange={e => setClientForm(p => ({ ...p, first_name: e.target.value }))}
                    className={`input ${!clientForm.first_name ? 'border-red-700 focus:ring-red-600/40' : ''}`} placeholder="Required" />
                </div>
                <div>
                  <label className="section-title">Last Name <span className="text-red-400">*</span></label>
                  <input value={clientForm.last_name} onChange={e => setClientForm(p => ({ ...p, last_name: e.target.value }))}
                    className={`input ${!clientForm.last_name ? 'border-red-700 focus:ring-red-600/40' : ''}`} placeholder="Required" />
                </div>
                <div>
                  <label className="section-title">Email <span className="text-red-400">*</span></label>
                  <input value={clientForm.email} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))}
                    className={`input ${!clientForm.email ? 'border-red-700 focus:ring-red-600/40' : ''}`} type="email" placeholder="Required" />
                </div>
                <div>
                  <label className="section-title">Phone</label>
                  <input value={clientForm.phone} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="section-title">Age</label>
                  <input value={clientForm.age} onChange={e => setClientForm(p => ({ ...p, age: e.target.value }))}
                    className="input" type="number" placeholder="e.g. 42" />
                </div>
                <div>
                  <label className="section-title">Marital Status</label>
                  <select value={clientForm.marital_status} onChange={e => setClientForm(p => ({ ...p, marital_status: e.target.value }))} className="input">
                    {['single', 'married', 'divorced', 'widowed', 'domestic_partner', 'separated'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="section-title">Dependents</label>
                  <input value={clientForm.number_of_dependents} onChange={e => setClientForm(p => ({ ...p, number_of_dependents: e.target.value }))}
                    className="input" type="number" min="0" />
                </div>
                <div>
                  <label className="section-title">Employment</label>
                  <select value={clientForm.employment_status} onChange={e => setClientForm(p => ({ ...p, employment_status: e.target.value }))} className="input">
                    {['employed', 'self_employed', 'retired', 'unemployed', 'student', 'part_time', 'disability'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* — Financials — */}
            <div>
              <div className="section-title text-accent mb-3">Financials</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="section-title">Annual Income ($)</label>
                  <input value={clientForm.annual_income} onChange={e => setClientForm(p => ({ ...p, annual_income: e.target.value }))}
                    className="input" type="number" placeholder="Household income" />
                </div>
                <div>
                  <label className="section-title">Investable Assets ($)</label>
                  <input value={clientForm.aum} onChange={e => setClientForm(p => ({ ...p, aum: e.target.value }))}
                    className="input" type="number" placeholder="Liquid / investable" />
                </div>
                <div>
                  <label className="section-title">Monthly Expenses ($)</label>
                  <input value={clientForm.monthly_expenses} onChange={e => setClientForm(p => ({ ...p, monthly_expenses: e.target.value }))}
                    className="input" type="number" placeholder="Total household burn" />
                </div>
                <div>
                  <label className="section-title">Years to Retirement</label>
                  <input value={clientForm.years_to_retirement} onChange={e => setClientForm(p => ({ ...p, years_to_retirement: e.target.value }))}
                    className="input" type="number" placeholder="e.g. 15" />
                </div>
              </div>
            </div>

            {/* — Risk & Goals — */}
            <div>
              <div className="section-title text-accent mb-3">Risk & Goals</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="section-title">Life Stage</label>
                  <select value={clientForm.life_stage} onChange={e => setClientForm(p => ({ ...p, life_stage: e.target.value }))} className="input">
                    {['early_career', 'accumulation', 'pre_retirement', 'retirement', 'distribution', 'wealth_transfer'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="section-title">Risk Tolerance</label>
                  <select value={clientForm.risk} onChange={e => setClientForm(p => ({ ...p, risk: e.target.value }))} className="input">
                    {['very_conservative', 'conservative', 'moderate', 'moderately_aggressive', 'aggressive'].map(r => (
                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="section-title">Primary Goal</label>
                  <select value={clientForm.primary_goal} onChange={e => setClientForm(p => ({ ...p, primary_goal: e.target.value }))} className="input">
                    {['retirement', 'education', 'home_purchase', 'business_investment', 'emergency_fund', 'income_generation', 'estate_transfer', 'charitable', 'debt_payoff', 'custom'].map(g => (
                      <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* — Insurance & Estate flags — */}
            <div>
              <div className="section-title text-accent mb-3">Insurance & Estate (quick flags)</div>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'has_life_insurance', label: 'Life insurance in place' },
                  { key: 'has_will',            label: 'Will or trust on file' },
                  { key: 'has_trust',           label: 'Revocable / irrevocable trust' },
                ] as { key: keyof ClientForm; label: string }[]).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group p-2 rounded-lg border border-border hover:border-accent/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={clientForm[key] as boolean}
                      onChange={e => setClientForm(p => ({ ...p, [key]: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-accent"
                    />
                    <span className="text-xs text-gray-300 group-hover:text-gray-100">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1 border-t border-border">
              <button
                onClick={createAndLinkClient}
                disabled={creatingClient || !clientForm.first_name || !clientForm.last_name || !clientForm.email}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {creatingClient ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Create Client & Save Meeting
              </button>
              <button onClick={() => setStage('complete')} className="btn-secondary text-sm">
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Complete ── */}
      {stage === 'complete' && (
        <div className="space-y-5 max-w-2xl">
          <div className="card text-center space-y-3">
            <CheckCircle size={48} className="text-green-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-100">Meeting Complete</h3>
              <p className="text-sm text-gray-400 mt-1">
                {createdClient
                  ? 'Prospect profile created and meeting saved to their CRM record.'
                  : 'Transcript, sentiment, recommendations, and summaries saved to CosmosDB.'}
              </p>
            </div>
            <button onClick={resetMeeting} className="btn-secondary">Start Another Meeting</button>
          </div>

          {/* ── Action Items & Next Steps ── */}
          {completedSession && (completedSession.action_items as unknown[])?.length > 0 && (
            <div className="card space-y-3">
              <div className="section-title text-accent">Action Items &amp; Next Steps</div>
              <ul className="space-y-2">
                {(completedSession.action_items as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-200">
                    <CheckCircle size={14} className="shrink-0 mt-0.5 text-green-400" />
                    {typeof item === 'object' ? JSON.stringify(item) : item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Key Decisions ── */}
          {completedSession && (completedSession.key_decisions as unknown[])?.length > 0 && (
            <div className="card space-y-3">
              <div className="section-title">Key Decisions</div>
              <ul className="space-y-2">
                {(completedSession.key_decisions as string[]).map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    {typeof d === 'object' ? JSON.stringify(d) : d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Approved Recommendations ── */}
          {completedSession && (completedSession.recommendations as unknown[])?.length > 0 && (
            <div className="card space-y-3">
              <div className="section-title">Approved Recommendations</div>
              <ul className="space-y-2">
                {(completedSession.recommendations as Record<string, unknown>[]).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300 rounded-lg bg-surface-50 px-3 py-2">
                    <span className="text-accent font-semibold shrink-0">{i + 1}.</span>
                    <div>
                      <div className="text-gray-200 font-medium">{String(r.title ?? r.recommendation ?? '')}</div>
                      {r.rationale != null && <div className="text-xs text-gray-500 mt-0.5">{String(r.rationale as string)}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Audit trail link ── */}
          {session && (
            <div className="text-center">
              <a
                href={`/audit?session_id=${session.id as string}${session.client_id ? `&client_id=${session.client_id as string}` : ''}`}
                className="text-xs text-accent hover:underline"
              >
                View full audit trail for this session →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
