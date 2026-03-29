"""
Pydantic models for client intelligence — profiles, risk assessment,
goals, accounts, and relationship management.
"""
from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


# ── Enumerations ──────────────────────────────────────────────────────────────

class RiskTolerance(str, Enum):
    VERY_CONSERVATIVE    = "very_conservative"
    CONSERVATIVE         = "conservative"
    MODERATE             = "moderate"
    MODERATELY_AGGRESSIVE = "moderately_aggressive"
    AGGRESSIVE           = "aggressive"


class ClientStatus(str, Enum):
    PROSPECT = "prospect"
    ACTIVE   = "active"
    INACTIVE = "inactive"
    VIP      = "vip"


class MaritalStatus(str, Enum):
    SINGLE           = "single"
    MARRIED          = "married"
    DIVORCED         = "divorced"
    WIDOWED          = "widowed"
    DOMESTIC_PARTNER = "domestic_partner"
    SEPARATED        = "separated"


class EmploymentStatus(str, Enum):
    EMPLOYED      = "employed"
    SELF_EMPLOYED = "self_employed"
    RETIRED       = "retired"
    UNEMPLOYED    = "unemployed"
    STUDENT       = "student"
    PART_TIME     = "part_time"
    DISABILITY    = "disability"


class LifeStage(str, Enum):
    EARLY_CAREER    = "early_career"      # <35, building wealth / paying debt
    ACCUMULATION    = "accumulation"      # 35-50, peak earning, saving aggressively
    PRE_RETIREMENT  = "pre_retirement"    # 50-65, consolidating, de-risking
    RETIREMENT      = "retirement"        # In retirement, income-generation focus
    DISTRIBUTION    = "distribution"      # Drawing down assets
    WEALTH_TRANSFER = "wealth_transfer"   # Estate / legacy planning phase


class GoalType(str, Enum):
    RETIREMENT         = "retirement"
    EDUCATION          = "education"
    HOME_PURCHASE      = "home_purchase"
    BUSINESS           = "business_investment"
    EMERGENCY_FUND     = "emergency_fund"
    INCOME_GENERATION  = "income_generation"
    ESTATE_TRANSFER    = "estate_transfer"
    CHARITABLE         = "charitable"
    DEBT_PAYOFF        = "debt_payoff"
    MAJOR_PURCHASE     = "major_purchase"
    CUSTOM             = "custom"


# ── Sub-models ────────────────────────────────────────────────────────────────

class InvestmentGoal(BaseModel):
    goal_id:              str       = Field(default_factory=lambda: str(uuid4()))
    goal_type:            GoalType  = GoalType.CUSTOM
    name:                 str
    target_amount:        float     = 0.0
    target_date:          Optional[date] = None
    current_amount:       float     = 0.0
    monthly_contribution: float     = 0.0
    priority:             int       = 1    # 1=highest
    notes:                str       = ""


class AccountHolding(BaseModel):
    symbol:       str
    name:         str
    account_type: str   # "taxable" | "ira" | "401k" | "roth" | "529"
    quantity:     float
    cost_basis:   float
    current_value: float
    unrealized_pnl: float = 0.0
    weight:       float = 0.0


class InsuranceCoverage(BaseModel):
    """Insurance policies in force for the client household."""
    life_insurance_type:   str   = ""      # "term" | "whole" | "universal" | "vul" | "none"
    life_insurance_amount: float = 0.0     # total death benefit
    disability_insurance:  bool  = False
    disability_monthly_benefit: float = 0.0
    long_term_care_insurance:   bool  = False
    ltc_daily_benefit:          float = 0.0
    umbrella_policy:            bool  = False
    umbrella_limit:             float = 0.0
    notes:                      str   = ""


class EstatePlanningProfile(BaseModel):
    """Estate planning documents and intentions."""
    has_will:                    bool  = False
    has_revocable_trust:         bool  = False
    has_irrevocable_trust:       bool  = False
    has_power_of_attorney:       bool  = False
    has_healthcare_directive:    bool  = False
    beneficiaries_updated:       bool  = False
    estate_value_estimate:       float = 0.0
    charitable_intent:           bool  = False
    charitable_entity:           str   = ""   # donor-advised fund, foundation, etc.
    notes:                       str   = ""


class TaxProfile(BaseModel):
    """Filing, brackets, and tax-advantaged account balances."""
    filing_status:              str   = "single"  # "single" | "married_joint" | "married_separate" | "head_of_household"
    federal_bracket:            float = 0.22      # marginal rate, e.g. 0.22
    state:                      str   = ""
    state_rate:                 float = 0.0
    estimated_income:           float = 0.0

    # Strategy preferences
    capital_gains_preference:       str  = "long_term"   # "short_term" | "long_term" | "tax_exempt"
    tax_loss_harvesting_enabled:    bool = True

    # Tax-advantaged accounts
    has_401k:                        bool  = False
    retirement_contribution_annual:  float = 0.0     # total 401k/403b contributions per year
    k401_balance:                    float = 0.0
    ira_balance:                     float = 0.0
    roth_ira_balance:                float = 0.0
    hsa_balance:                     float = 0.0
    pension_monthly_income:          float = 0.0     # expected or current pension
    social_security_eligible:        bool  = False
    social_security_monthly_estimate: float = 0.0

    notes: str = ""


class RiskProfile(BaseModel):
    """
    Dual risk model: tolerance (emotional preference) vs capacity (financial ability).
    These often diverge and drive the advisor's portfolio construction conversation.
    """
    # Emotional / stated preference
    tolerance:                  RiskTolerance = RiskTolerance.MODERATE

    # Financial ability to absorb losses (based on income, reserves, time horizon)
    risk_capacity:              RiskTolerance = RiskTolerance.MODERATE

    investment_horizon_years:   int   = 10
    liquidity_needs:            str   = "low"     # "low" | "medium" | "high"
    income_stability:           str   = "stable"  # "unstable" | "stable" | "very_stable"
    max_drawdown_tolerance:     float = 0.20      # fraction the client can stomach losing

    # Target allocation
    equity_allocation_target:  float = 0.60
    fixed_income_target:       float = 0.30
    alternatives_target:       float = 0.10

    esg_preference:            bool  = False

    # Experience & behaviour
    investment_experience_years: int   = 0
    previous_investing_behavior: str   = ""   # e.g. "panic-sold in 2020 then bought back in"
    loss_aversion_score:         float = 0.5  # 0 = fearless, 1 = extreme loss aversion
    behavioral_notes:            str   = ""   # advisor free-text on biases observed

    # Composite score (calculated by AI or questionnaire)
    risk_score:                  Optional[float] = None  # 1–10

    assessed_at:    Optional[datetime] = None
    assessed_by:    str                = ""
    questionnaire_responses: dict[str, Any] = Field(default_factory=dict)


# ── Core client profile ───────────────────────────────────────────────────────

class ClientProfile(BaseModel):
    client_id:  str          = Field(default_factory=lambda: str(uuid4()))
    advisor_id: str          = ""
    status:     ClientStatus = ClientStatus.PROSPECT

    # ── Personal ──────────────────────────────────────────────────────────────
    first_name:   str
    last_name:    str
    email:        str           = ""
    phone:        str           = ""
    date_of_birth: Optional[date] = None
    age:          Optional[int]  = None   # computed or advisor-entered
    citizenship:  str           = "US"

    # ── Family & dependents ───────────────────────────────────────────────────
    marital_status:     MaritalStatus = MaritalStatus.SINGLE
    spouse_name:        str           = ""
    spouse_age:         Optional[int] = None
    spouse_employment:  EmploymentStatus = EmploymentStatus.EMPLOYED
    spouse_annual_income: float       = 0.0
    number_of_dependents: int         = 0
    dependent_ages:     list[int]     = Field(default_factory=list)
    has_elderly_parents: bool         = False   # triggers LTC / caregiving conversation

    # ── Employment ────────────────────────────────────────────────────────────
    employment_status:    EmploymentStatus = EmploymentStatus.EMPLOYED
    employer:             str              = ""
    job_title:            str              = ""
    industry:             str              = ""
    years_with_employer:  int              = 0

    # ── Life stage & retirement ───────────────────────────────────────────────
    life_stage:              LifeStage     = LifeStage.ACCUMULATION
    expected_retirement_age: Optional[int] = None
    years_to_retirement:     Optional[int] = None

    # ── Household financials ──────────────────────────────────────────────────
    annual_income:          float = 0.0   # client's own income
    household_income:       float = 0.0   # total household (client + spouse)
    net_worth:              float = 0.0
    investable_assets:      float = 0.0
    monthly_expenses:       float = 0.0   # total household spending
    monthly_debt_payments:  float = 0.0   # mortgage P&I + loan minimums

    # Emergency fund
    emergency_fund_months:  float = 0.0   # months of expenses saved in liquid cash

    # Debt detail
    total_debt:             float = 0.0
    has_mortgage:           bool  = False
    mortgage_balance:       float = 0.0
    mortgage_rate:          float = 0.0   # APR
    student_loan_balance:   float = 0.0
    auto_loan_balance:      float = 0.0
    credit_card_balance:    float = 0.0
    other_debt:             float = 0.0

    # ── Risk, goals, tax, insurance, estate ──────────────────────────────────
    risk_profile:    RiskProfile          = Field(default_factory=RiskProfile)
    goals:           list[InvestmentGoal] = Field(default_factory=list)
    tax_profile:     TaxProfile           = Field(default_factory=TaxProfile)
    insurance:       InsuranceCoverage    = Field(default_factory=InsuranceCoverage)
    estate_planning: EstatePlanningProfile = Field(default_factory=EstatePlanningProfile)

    # ── Portfolio ─────────────────────────────────────────────────────────────
    holdings:        list[AccountHolding] = Field(default_factory=list)
    portfolio_value: float                = 0.0

    # ── Relationship ──────────────────────────────────────────────────────────
    referring_advisor:   str             = ""
    relationship_start:  Optional[date]  = None
    last_meeting_at:     Optional[datetime] = None
    next_meeting_at:     Optional[datetime] = None
    meeting_count:       int             = 0
    lifetime_value:      float           = 0.0
    satisfaction_score:  float           = 0.0   # 0–10

    # ── AI-extracted meeting metadata ─────────────────────────────────────────
    extracted_preferences:  dict[str, Any] = Field(default_factory=dict)
    extracted_concerns:     list[str]      = Field(default_factory=list)
    extracted_life_events:  list[str]      = Field(default_factory=list)
    next_actions:           list[str]      = Field(default_factory=list)  # action items from meetings
    relationship_notes:     str            = ""

    # ── Segmentation ──────────────────────────────────────────────────────────
    tags:    list[str] = Field(default_factory=list)
    segment: str       = "standard"   # "standard" | "high_net_worth" | "ultra_high_net_worth"

    metadata:   dict[str, Any] = Field(default_factory=dict)
    created_at: datetime       = Field(default_factory=datetime.utcnow)
    updated_at: datetime       = Field(default_factory=datetime.utcnow)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


# ── Request / response models ─────────────────────────────────────────────────

class CreateClientRequest(BaseModel):
    # Required
    first_name: str
    last_name:  str

    # Contact
    email: str = ""
    phone: str = ""

    # Identity
    advisor_id:     str           = ""
    date_of_birth:  Optional[date] = None
    age:            Optional[int]  = None
    citizenship:    str           = "US"

    # Family
    marital_status:       MaritalStatus     = MaritalStatus.SINGLE
    spouse_name:          str               = ""
    spouse_age:           Optional[int]     = None
    spouse_annual_income: float             = 0.0
    number_of_dependents: int               = 0
    dependent_ages:       list[int]         = Field(default_factory=list)
    has_elderly_parents:  bool              = False

    # Employment
    employment_status:  EmploymentStatus = EmploymentStatus.EMPLOYED
    employer:           str              = ""
    job_title:          str              = ""
    industry:           str              = ""

    # Life stage
    life_stage:              LifeStage     = LifeStage.ACCUMULATION
    expected_retirement_age: Optional[int] = None
    years_to_retirement:     Optional[int] = None

    # Financials
    annual_income:          float = 0.0
    household_income:       float = 0.0
    net_worth:              float = 0.0
    investable_assets:      float = 0.0
    monthly_expenses:       float = 0.0
    monthly_debt_payments:  float = 0.0
    emergency_fund_months:  float = 0.0

    # Debt
    has_mortgage:         bool  = False
    mortgage_balance:     float = 0.0
    student_loan_balance: float = 0.0
    total_debt:           float = 0.0

    # Risk
    risk_tolerance:           RiskTolerance = RiskTolerance.MODERATE
    risk_capacity:            RiskTolerance = RiskTolerance.MODERATE
    investment_horizon_years: int           = 10

    # Tax-advantaged
    has_401k:                       bool  = False
    retirement_contribution_annual:  float = 0.0
    ira_balance:                    float = 0.0
    roth_ira_balance:               float = 0.0
    hsa_balance:                    float = 0.0

    # Insurance flags (quick intake)
    has_life_insurance:        bool  = False
    life_insurance_amount:     float = 0.0
    has_disability_insurance:  bool  = False
    has_ltc_insurance:         bool  = False

    # Estate
    has_will:    bool = False
    has_trust:   bool = False

    # Primary goal
    primary_goal_type: GoalType = GoalType.RETIREMENT

    status: ClientStatus = ClientStatus.PROSPECT
    notes: str = ""


class UpdateRiskProfileRequest(BaseModel):
    tolerance:                 RiskTolerance
    risk_capacity:             RiskTolerance = RiskTolerance.MODERATE
    investment_horizon_years:  int           = 10
    max_drawdown_tolerance:    float         = 0.20
    equity_allocation_target:  float         = 0.60
    fixed_income_target:       float         = 0.30
    alternatives_target:       float         = 0.10
    loss_aversion_score:       float         = 0.5
    investment_experience_years: int         = 0
    behavioral_notes:          str           = ""
    assessed_by:               str           = ""
    questionnaire_responses:   dict[str, Any] = Field(default_factory=dict)
