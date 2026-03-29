import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, ArrowRight, Filter, Trash2, AlertTriangle } from 'lucide-react'
import { clientsApi } from '@/api'
import type { ClientProfile } from '@/types'

/** Fields that must be filled before portfolio recommendations and planning can run. */
function getMissingFields(c: ClientProfile): string[] {
  const m: string[] = []
  if (!c.phone)                   m.push('Phone')
  if (!c.aum)                     m.push('AUM')
  if (!c.annual_income)           m.push('Income')
  if (!c.risk_profile)            m.push('Risk profile')
  if (!c.goals?.length)           m.push('Goals')
  if (!c.insurance)               m.push('Insurance')
  if (!c.estate_planning)         m.push('Estate plan')
  return m
}

const RISK_COLORS: Record<string, string> = {
  conservative: 'text-blue-400 bg-blue-900/30 border-blue-800/40',
  moderate: 'text-green-400 bg-green-900/30 border-green-800/40',
  aggressive: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/40',
  very_aggressive: 'text-red-400 bg-red-900/30 border-red-800/40',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'badge-success',
  prospect: 'badge-info',
  inactive: 'text-gray-500 bg-surface-50 border-border badge',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createTab, setCreateTab] = useState<'personal' | 'family' | 'financial' | 'risk'>('personal')
  const [form, setForm] = useState({
    // Personal
    first_name: '', last_name: '', email: '', phone: '',
    date_of_birth: '', citizenship: 'US',
    // Family
    marital_status: 'single', spouse_name: '', spouse_age: '', spouse_annual_income: '',
    number_of_dependents: '0', has_elderly_parents: false,
    // Employment & life stage
    employment_status: 'employed', job_title: '', employer: '', industry: '',
    life_stage: 'accumulation', expected_retirement_age: '', years_to_retirement: '',
    // Financials
    annual_income: '', household_income: '', net_worth: '', aum: '',
    monthly_expenses: '', monthly_debt_payments: '', emergency_fund_months: '',
    has_mortgage: false, mortgage_balance: '', student_loan_balance: '', total_debt: '',
    // Tax-advantaged
    has_401k: false, retirement_contribution_annual: '',
    ira_balance: '', roth_ira_balance: '', hsa_balance: '',
    // Risk
    risk_tolerance: 'moderate', risk_capacity: 'moderate',
    investment_horizon_years: '10',
    primary_goal_type: 'retirement',
    // Insurance flags
    has_life_insurance: false, life_insurance_amount: '',
    has_disability_insurance: false, has_ltc_insurance: false,
    // Estate
    has_will: false, has_trust: false,
    status: 'active',
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ClientProfile | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = (q?: string) => {
    setLoading(true)
    clientsApi.list(q ? { query: q } : undefined).then(setClients).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const createClient = async () => {
    setSaving(true)
    try {
      await clientsApi.create({
        first_name:                  form.first_name,
        last_name:                   form.last_name,
        email:                       form.email,
        phone:                       form.phone || undefined,
        date_of_birth:               form.date_of_birth || undefined,
        citizenship:                 form.citizenship,
        marital_status:              form.marital_status as ClientProfile['marital_status'],
        spouse_name:                 form.spouse_name || undefined,
        spouse_age:                  form.spouse_age ? Number(form.spouse_age) : undefined,
        spouse_annual_income:        form.spouse_annual_income ? Number(form.spouse_annual_income) : undefined,
        number_of_dependents:        Number(form.number_of_dependents),
        has_elderly_parents:         form.has_elderly_parents,
        employment_status:           form.employment_status as ClientProfile['employment_status'],
        job_title:                   form.job_title || undefined,
        employer:                    form.employer || undefined,
        industry:                    form.industry || undefined,
        life_stage:                  form.life_stage as ClientProfile['life_stage'],
        expected_retirement_age:     form.expected_retirement_age ? Number(form.expected_retirement_age) : undefined,
        years_to_retirement:         form.years_to_retirement ? Number(form.years_to_retirement) : undefined,
        annual_income:               form.annual_income ? Number(form.annual_income) : undefined,
        household_income:            form.household_income ? Number(form.household_income) : undefined,
        net_worth:                   form.net_worth ? Number(form.net_worth) : undefined,
        investable_assets:           form.aum ? Number(form.aum) : undefined,
        monthly_expenses:            form.monthly_expenses ? Number(form.monthly_expenses) : undefined,
        monthly_debt_payments:       form.monthly_debt_payments ? Number(form.monthly_debt_payments) : undefined,
        emergency_fund_months:       form.emergency_fund_months ? Number(form.emergency_fund_months) : undefined,
        has_mortgage:                form.has_mortgage,
        mortgage_balance:            form.mortgage_balance ? Number(form.mortgage_balance) : undefined,
        student_loan_balance:        form.student_loan_balance ? Number(form.student_loan_balance) : undefined,
        total_debt:                  form.total_debt ? Number(form.total_debt) : undefined,
        has_401k:                    form.has_401k,
        retirement_contribution_annual: form.retirement_contribution_annual ? Number(form.retirement_contribution_annual) : undefined,
        ira_balance:                 form.ira_balance ? Number(form.ira_balance) : undefined,
        roth_ira_balance:            form.roth_ira_balance ? Number(form.roth_ira_balance) : undefined,
        hsa_balance:                 form.hsa_balance ? Number(form.hsa_balance) : undefined,
        risk_tolerance:              form.risk_tolerance as ClientProfile['risk_tolerance'],
        risk_capacity:               form.risk_capacity as ClientProfile['risk_tolerance'],
        investment_horizon_years:    Number(form.investment_horizon_years),
        primary_goal_type:           form.primary_goal_type,
        has_life_insurance:          form.has_life_insurance,
        life_insurance_amount:       form.life_insurance_amount ? Number(form.life_insurance_amount) : undefined,
        has_disability_insurance:    form.has_disability_insurance,
        has_ltc_insurance:           form.has_ltc_insurance,
        has_will:                    form.has_will,
        has_trust:                   form.has_trust,
        status:                      form.status as ClientProfile['status'],
      })
      setShowCreate(false)
      setCreateTab('personal')
      setForm({
        first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', citizenship: 'US',
        marital_status: 'single', spouse_name: '', spouse_age: '', spouse_annual_income: '',
        number_of_dependents: '0', has_elderly_parents: false,
        employment_status: 'employed', job_title: '', employer: '', industry: '',
        life_stage: 'accumulation', expected_retirement_age: '', years_to_retirement: '',
        annual_income: '', household_income: '', net_worth: '', aum: '',
        monthly_expenses: '', monthly_debt_payments: '', emergency_fund_months: '',
        has_mortgage: false, mortgage_balance: '', student_loan_balance: '', total_debt: '',
        has_401k: false, retirement_contribution_annual: '',
        ira_balance: '', roth_ira_balance: '', hsa_balance: '',
        risk_tolerance: 'moderate', risk_capacity: 'moderate',
        investment_horizon_years: '10', primary_goal_type: 'retirement',
        has_life_insurance: false, life_insurance_amount: '',
        has_disability_insurance: false, has_ltc_insurance: false,
        has_will: false, has_trust: false, status: 'active',
      })
      load()
    } finally {
      setSaving(false)
    }
  }

  const deleteClient = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await clientsApi.remove(confirmDelete.client_id ?? (confirmDelete as any).id)
      setConfirmDelete(null)
      load()
    } finally {
      setDeleting(false)
    }
  }

  const filtered = clients.filter(c =>
    !query || `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Client Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} total clients · AI-powered CRM profiles</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Search / filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(query)}
            placeholder="Search clients (semantic AI search)…"
            className="input pl-8"
          />
        </div>
        <button onClick={() => load(query)} className="btn-secondary flex items-center gap-2">
          <Filter size={14} /> Search
        </button>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-red-900/50 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-semibold text-red-400">Delete Client</h3>
            <p className="text-sm text-gray-300">
              Permanently delete <span className="font-medium text-gray-100">{confirmDelete.first_name} {confirmDelete.last_name}</span> and all associated meetings, transcripts, portfolios, and conversations? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={deleteClient} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete Everything'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <h3 className="text-base font-semibold text-gray-100">Add Client</h3>
              {/* Tab nav */}
              <div className="flex gap-1 mt-3">
                {(['personal', 'family', 'financial', 'risk'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setCreateTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                      createTab === tab
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : 'text-gray-400 hover:text-gray-200 border border-transparent'
                    }`}
                  >{tab}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* ─ Personal ─ */}
              {createTab === 'personal' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="section-title">First Name <span className="text-red-400">*</span></label>
                      <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="section-title">Last Name <span className="text-red-400">*</span></label>
                      <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="section-title">Email <span className="text-red-400">*</span></label>
                      <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input" type="email" />
                    </div>
                    <div>
                      <label className="section-title">Phone</label>
                      <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="section-title">Date of Birth</label>
                      <input value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} className="input" type="date" />
                    </div>
                    <div>
                      <label className="section-title">Citizenship</label>
                      <input value={form.citizenship} onChange={e => setForm(p => ({ ...p, citizenship: e.target.value }))} className="input" placeholder="US" />
                    </div>
                    <div>
                      <label className="section-title">Status</label>
                      <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input">
                        {['active', 'prospect', 'inactive', 'vip'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="section-title">Employment</label>
                      <select value={form.employment_status} onChange={e => setForm(p => ({ ...p, employment_status: e.target.value }))} className="input">
                        {['employed', 'self_employed', 'retired', 'unemployed', 'student', 'part_time', 'disability'].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="section-title">Job Title</label>
                      <input value={form.job_title} onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="section-title">Employer</label>
                      <input value={form.employer} onChange={e => setForm(p => ({ ...p, employer: e.target.value }))} className="input" />
                    </div>
                    <div className="col-span-2">
                      <label className="section-title">Industry</label>
                      <input value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} className="input" placeholder="e.g. Technology, Healthcare, Finance" />
                    </div>
                  </div>
                </>
              )}

              {/* ─ Family ─ */}
              {createTab === 'family' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="section-title">Marital Status</label>
                      <select value={form.marital_status} onChange={e => setForm(p => ({ ...p, marital_status: e.target.value }))} className="input">
                        {['single', 'married', 'divorced', 'widowed', 'domestic_partner', 'separated'].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    {['married', 'domestic_partner'].includes(form.marital_status) && (
                      <>
                        <div>
                          <label className="section-title">Spouse / Partner Name</label>
                          <input value={form.spouse_name} onChange={e => setForm(p => ({ ...p, spouse_name: e.target.value }))} className="input" />
                        </div>
                        <div>
                          <label className="section-title">Spouse Age</label>
                          <input value={form.spouse_age} onChange={e => setForm(p => ({ ...p, spouse_age: e.target.value }))} className="input" type="number" />
                        </div>
                        <div className="col-span-2">
                          <label className="section-title">Spouse Annual Income ($)</label>
                          <input value={form.spouse_annual_income} onChange={e => setForm(p => ({ ...p, spouse_annual_income: e.target.value }))} className="input" type="number" />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="section-title">Number of Dependents</label>
                      <input value={form.number_of_dependents} onChange={e => setForm(p => ({ ...p, number_of_dependents: e.target.value }))} className="input" type="number" min="0" />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.has_elderly_parents} onChange={e => setForm(p => ({ ...p, has_elderly_parents: e.target.checked }))} className="w-3.5 h-3.5 accent-accent" />
                        <span className="text-xs text-gray-300">Has elderly parent(s) to support</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* ─ Financial ─ */}
              {createTab === 'financial' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="section-title">Annual Income ($)</label>
                      <input value={form.annual_income} onChange={e => setForm(p => ({ ...p, annual_income: e.target.value }))} className="input" type="number" />
                    </div>
                    <div>
                      <label className="section-title">Household Income ($)</label>
                      <input value={form.household_income} onChange={e => setForm(p => ({ ...p, household_income: e.target.value }))} className="input" type="number" />
                    </div>
                    <div>
                      <label className="section-title">Net Worth ($)</label>
                      <input value={form.net_worth} onChange={e => setForm(p => ({ ...p, net_worth: e.target.value }))} className="input" type="number" />
                    </div>
                    <div>
                      <label className="section-title">Investable Assets ($)</label>
                      <input value={form.aum} onChange={e => setForm(p => ({ ...p, aum: e.target.value }))} className="input" type="number" />
                    </div>
                    <div>
                      <label className="section-title">Monthly Expenses ($)</label>
                      <input value={form.monthly_expenses} onChange={e => setForm(p => ({ ...p, monthly_expenses: e.target.value }))} className="input" type="number" />
                    </div>
                    <div>
                      <label className="section-title">Monthly Debt Payments ($)</label>
                      <input value={form.monthly_debt_payments} onChange={e => setForm(p => ({ ...p, monthly_debt_payments: e.target.value }))} className="input" type="number" />
                    </div>
                    <div>
                      <label className="section-title">Emergency Fund (months)</label>
                      <input value={form.emergency_fund_months} onChange={e => setForm(p => ({ ...p, emergency_fund_months: e.target.value }))} className="input" type="number" step="0.5" />
                    </div>
                    <div>
                      <label className="section-title">Total Debt ($)</label>
                      <input value={form.total_debt} onChange={e => setForm(p => ({ ...p, total_debt: e.target.value }))} className="input" type="number" />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.has_mortgage} onChange={e => setForm(p => ({ ...p, has_mortgage: e.target.checked }))} className="w-3.5 h-3.5 accent-accent" />
                        <span className="text-xs text-gray-300">Has mortgage</span>
                      </label>
                    </div>
                    {form.has_mortgage && (
                      <div>
                        <label className="section-title">Mortgage Balance ($)</label>
                        <input value={form.mortgage_balance} onChange={e => setForm(p => ({ ...p, mortgage_balance: e.target.value }))} className="input" type="number" />
                      </div>
                    )}
                    <div>
                      <label className="section-title">Student Loan Balance ($)</label>
                      <input value={form.student_loan_balance} onChange={e => setForm(p => ({ ...p, student_loan_balance: e.target.value }))} className="input" type="number" />
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="section-title text-accent mb-2">Tax-Advantaged Accounts</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.has_401k} onChange={e => setForm(p => ({ ...p, has_401k: e.target.checked }))} className="w-3.5 h-3.5 accent-accent" />
                          <span className="text-xs text-gray-300">Has 401(k) / 403(b)</span>
                        </label>
                      </div>
                      {form.has_401k && (
                        <div>
                          <label className="section-title">Annual Contribution ($)</label>
                          <input value={form.retirement_contribution_annual} onChange={e => setForm(p => ({ ...p, retirement_contribution_annual: e.target.value }))} className="input" type="number" />
                        </div>
                      )}
                      <div>
                        <label className="section-title">IRA Balance ($)</label>
                        <input value={form.ira_balance} onChange={e => setForm(p => ({ ...p, ira_balance: e.target.value }))} className="input" type="number" />
                      </div>
                      <div>
                        <label className="section-title">Roth IRA Balance ($)</label>
                        <input value={form.roth_ira_balance} onChange={e => setForm(p => ({ ...p, roth_ira_balance: e.target.value }))} className="input" type="number" />
                      </div>
                      <div>
                        <label className="section-title">HSA Balance ($)</label>
                        <input value={form.hsa_balance} onChange={e => setForm(p => ({ ...p, hsa_balance: e.target.value }))} className="input" type="number" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ─ Risk & Goals ─ */}
              {createTab === 'risk' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="section-title">Life Stage</label>
                      <select value={form.life_stage} onChange={e => setForm(p => ({ ...p, life_stage: e.target.value }))} className="input">
                        {['early_career', 'accumulation', 'pre_retirement', 'retirement', 'distribution', 'wealth_transfer'].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="section-title">Expected Retirement Age</label>
                      <input value={form.expected_retirement_age} onChange={e => setForm(p => ({ ...p, expected_retirement_age: e.target.value }))} className="input" type="number" placeholder="e.g. 65" />
                    </div>
                    <div>
                      <label className="section-title">Risk Tolerance (stated)</label>
                      <select value={form.risk_tolerance} onChange={e => setForm(p => ({ ...p, risk_tolerance: e.target.value }))} className="input">
                        {['very_conservative', 'conservative', 'moderate', 'moderately_aggressive', 'aggressive'].map(r => (
                          <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="section-title">Risk Capacity (financial ability)</label>
                      <select value={form.risk_capacity} onChange={e => setForm(p => ({ ...p, risk_capacity: e.target.value }))} className="input">
                        {['very_conservative', 'conservative', 'moderate', 'moderately_aggressive', 'aggressive'].map(r => (
                          <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="section-title">Investment Horizon (years)</label>
                      <input value={form.investment_horizon_years} onChange={e => setForm(p => ({ ...p, investment_horizon_years: e.target.value }))} className="input" type="number" />
                    </div>
                    <div>
                      <label className="section-title">Primary Goal</label>
                      <select value={form.primary_goal_type} onChange={e => setForm(p => ({ ...p, primary_goal_type: e.target.value }))} className="input">
                        {['retirement', 'education', 'home_purchase', 'business_investment', 'emergency_fund', 'income_generation', 'estate_transfer', 'charitable', 'debt_payoff', 'custom'].map(g => (
                          <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="section-title text-accent mb-2">Insurance in Place</div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.has_life_insurance} onChange={e => setForm(p => ({ ...p, has_life_insurance: e.target.checked }))} className="w-3.5 h-3.5 accent-accent" />
                        <span className="text-xs text-gray-300">Life insurance</span>
                      </label>
                      {form.has_life_insurance && (
                        <div>
                          <label className="section-title">Death Benefit ($)</label>
                          <input value={form.life_insurance_amount} onChange={e => setForm(p => ({ ...p, life_insurance_amount: e.target.value }))} className="input" type="number" />
                        </div>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.has_disability_insurance} onChange={e => setForm(p => ({ ...p, has_disability_insurance: e.target.checked }))} className="w-3.5 h-3.5 accent-accent" />
                        <span className="text-xs text-gray-300">Disability insurance</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.has_ltc_insurance} onChange={e => setForm(p => ({ ...p, has_ltc_insurance: e.target.checked }))} className="w-3.5 h-3.5 accent-accent" />
                        <span className="text-xs text-gray-300">Long-term care insurance</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="section-title text-accent mb-2">Estate Planning</div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.has_will} onChange={e => setForm(p => ({ ...p, has_will: e.target.checked }))} className="w-3.5 h-3.5 accent-accent" />
                        <span className="text-xs text-gray-300">Will on file</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.has_trust} onChange={e => setForm(p => ({ ...p, has_trust: e.target.checked }))} className="w-3.5 h-3.5 accent-accent" />
                        <span className="text-xs text-gray-300">Trust established</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

            </div>

            <div className="px-6 py-4 border-t border-border flex gap-3">
              <button
                onClick={createClient}
                disabled={saving || !form.first_name || !form.email}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving…' : 'Create Client'}
              </button>
              <button onClick={() => { setShowCreate(false); setCreateTab('personal') }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Client', 'AUM', 'Risk Profile', 'Status', 'Goals', 'Since', ''].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading clients…</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-surface-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                        {c.first_name[0]}{c.last_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-200">{c.first_name} {c.last_name}</span>
                          {getMissingFields(c).length > 0 && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 border border-amber-700/40 text-amber-400 font-medium cursor-default"
                              title={`Incomplete profile — missing: ${getMissingFields(c).join(', ')}`}
                            >
                              <AlertTriangle size={9} /> {getMissingFields(c).length}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-300">${(c.aum / 1e6).toFixed(2)}M</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[11px] border ${RISK_COLORS[c.risk_tolerance] ?? ''}`}>
                      {c.risk_tolerance?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUS_COLORS[c.status] ?? 'badge'}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.goals?.length ?? 0} goals</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.relationship_since ? new Date(c.relationship_since).getFullYear() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/clients/${c.id}`} className="btn-ghost flex items-center gap-1 text-xs">
                        View <ArrowRight size={11} />
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(c)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        title="Delete client"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No clients found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
