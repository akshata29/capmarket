"""
Pydantic models for portfolio intelligence — construction, backtesting,
rebalancing, and performance attribution.
"""
from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class PortfolioStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    ACTIVE = "active"
    ARCHIVED = "archived"


class PositionType(str, Enum):
    EQUITY = "equity"
    FIXED_INCOME = "fixed_income"
    ETF = "etf"
    OPTION = "option"
    ALTERNATIVE = "alternative"
    CASH = "cash"


class SignalDirection(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class Theme(BaseModel):
    theme_id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str
    confidence: float = Field(ge=0.0, le=1.0)
    catalysts: list[str] = Field(default_factory=list)
    horizon_days: int = 90
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Position(BaseModel):
    symbol: str
    name: str
    position_type: PositionType = PositionType.EQUITY
    weight: float = Field(ge=0.0, le=1.0)
    shares: int = 0
    entry_price: float = 0.0
    current_price: float = 0.0
    market_value: float = 0.0
    unrealized_pnl: float = 0.0
    unrealized_pnl_pct: float = 0.0
    signal: SignalDirection = SignalDirection.BUY
    conviction: str = "medium"  # "low" | "medium" | "high"
    theme: str = ""
    rationale: str = ""
    score: float = 0.0
    entry_date: Optional[date] = None


class PortfolioMetrics(BaseModel):
    total_value: float = 0.0
    cash: float = 0.0
    invested: float = 0.0
    total_return_pct: float = 0.0
    ytd_return_pct: float = 0.0
    volatility_annualized: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    beta: float = 1.0
    alpha: float = 0.0
    hhi: float = 0.0  # Herfindahl-Hirschman Index (concentration)
    var_95: float = 0.0  # 95% Value at Risk
    computed_at: datetime = Field(default_factory=datetime.utcnow)


class PortfolioProposal(BaseModel):
    proposal_id: str = Field(default_factory=lambda: str(uuid4()))
    client_id: str
    advisor_id: str
    run_id: str = ""
    status: PortfolioStatus = PortfolioStatus.DRAFT
    mandate: str = ""
    investment_amount: float = 0.0
    themes: list[Theme] = Field(default_factory=list)
    positions: list[Position] = Field(default_factory=list)
    metrics: PortfolioMetrics = Field(default_factory=PortfolioMetrics)
    rationale: str = ""
    risk_notes: str = ""
    constraint_checks: dict[str, Any] = Field(default_factory=dict)

    # Human-in-the-loop
    requires_approval: bool = True
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: str = ""

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class BacktestResult(BaseModel):
    backtest_id: str = Field(default_factory=lambda: str(uuid4()))
    client_id: str
    proposal_id: str
    start_date: date
    end_date: date
    initial_capital: float
    final_value: float
    total_return_pct: float
    cagr: float
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    benchmark_return_pct: float
    benchmark_symbol: str = "SPY"
    alpha: float
    equity_curve: list[dict[str, Any]] = Field(default_factory=list)
    monthly_returns: list[dict[str, Any]] = Field(default_factory=list)
    drawdown_periods: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RebalanceReport(BaseModel):
    report_id: str = Field(default_factory=lambda: str(uuid4()))
    portfolio_id: str
    client_id: str
    triggers: list[str] = Field(default_factory=list)
    trades: list[dict[str, Any]] = Field(default_factory=list)
    turnover_pct: float = 0.0
    estimated_tx_cost_bps: float = 0.0
    rationale: str = ""
    status: str = "pending"  # "pending" | "approved" | "rejected" | "executed"
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RunPortfolioRequest(BaseModel):
    client_id: str
    advisor_id: str
    mandate: str = ""
    investment_amount: float = 50_000.0
    focus_regions: str = "US"
    auto_approve_gates: bool = False
    run_backtest: bool = True
    client_profile: Optional[dict[str, Any]] = None


class ApproveProposalRequest(BaseModel):
    approved_by: str
    notes: str = ""


class RejectProposalRequest(BaseModel):
    rejected_by: str
    reason: str
