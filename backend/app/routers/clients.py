"""
Client Intelligence API Router — CRUD and AI enrichment for client profiles.

Endpoints:
  POST   /api/clients              Create client
  GET    /api/clients              List clients for advisor
  GET    /api/clients/{id}         Get client profile
  PUT    /api/clients/{id}         Update client profile
  POST   /api/clients/{id}/risk    Update risk profile
  GET    /api/clients/{id}/profile AI-enriched full profile view
  POST   /api/clients/{id}/search  Semantic search over client history
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from backend.app.models.client import (
    ClientProfile,
    ClientStatus,
    CreateClientRequest,
    EstatePlanningProfile,
    InsuranceCoverage,
    RiskProfile,
    RiskTolerance,
    TaxProfile,
    UpdateRiskProfileRequest,
)
from backend.app.persistence.cosmos_store import get_cosmos_store
from backend.app.persistence.search_store import get_search_store

router = APIRouter()
logger = logging.getLogger(__name__)


def _normalize_client(c: dict[str, Any]) -> dict[str, Any]:
    """
    Maps backend model field names to what the TypeScript frontend expects.
    Mutates in-place and returns the dict.
    """
    # AI-extracted lists: expose under both names for compatibility
    c.setdefault("life_events",  c.get("extracted_life_events", []))
    c.setdefault("concerns",     c.get("extracted_concerns", []))
    c.setdefault("preferences",  list(c.get("extracted_preferences", {}).values()) if isinstance(c.get("extracted_preferences"), dict) else c.get("extracted_preferences", []))

    # goals: stored as list of InvestmentGoal dicts; ensure it is always a list
    if not isinstance(c.get("goals"), list):
        c["goals"] = []

    # aum: frontend type uses `aum`; Python model stores `investable_assets`
    if not c.get("aum"):
        c["aum"] = c.get("investable_assets", 0) or 0

    # Financial fields: if stored as 0, try to back-fill from nested profile_extractions
    # stored in metadata (can happen when client was partially saved mid-meeting before
    # all financial details were captured in the conversation).
    _fin = (c.get("metadata") or {}).get("extracted_financial") or {}
    if not c.get("annual_income") and _fin.get("annual_income"):
        try: c["annual_income"] = float(str(_fin["annual_income"]).replace(",", "").replace("$", ""))
        except (ValueError, TypeError): pass
    if not c.get("net_worth") and _fin.get("net_worth"):
        try: c["net_worth"] = float(str(_fin["net_worth"]).replace(",", "").replace("$", ""))
        except (ValueError, TypeError): pass
    if not c.get("monthly_expenses") and _fin.get("monthly_expenses"):
        try: c["monthly_expenses"] = float(str(_fin["monthly_expenses"]).replace(",", "").replace("$", ""))
        except (ValueError, TypeError): pass
    if not c.get("investable_assets") and _fin.get("investable_assets"):
        try:
            c["investable_assets"] = float(str(_fin["investable_assets"]).replace(",", "").replace("$", ""))
            c["aum"] = c["investable_assets"]
        except (ValueError, TypeError): pass

    # risk_tolerance: flatten from nested risk_profile
    if not c.get("risk_tolerance"):
        rp = c.get("risk_profile") or {}
        c["risk_tolerance"] = rp.get("tolerance") or "moderate"

    # tax_bracket: expose as percentage from risk_profile (0.22 -> 22)
    if not c.get("tax_bracket"):
        tp = c.get("tax_profile") or {}
        fb = tp.get("federal_bracket", 0)
        c["tax_bracket"] = int(fb * 100) if fb and fb < 1 else int(fb or 0)

    # relationship_since: frontend expects ISO string from relationship_start date
    if not c.get("relationship_since") and c.get("relationship_start"):
        c["relationship_since"] = str(c["relationship_start"])

    return c


@router.post("", response_model=dict)
async def create_client(request: CreateClientRequest) -> dict[str, Any]:
    """Create a new client profile."""
    profile = ClientProfile(
        # Personal
        first_name=request.first_name,
        last_name=request.last_name,
        email=request.email,
        phone=request.phone,
        advisor_id=request.advisor_id,
        date_of_birth=request.date_of_birth,
        age=request.age,
        citizenship=request.citizenship,
        # Family
        marital_status=request.marital_status,
        spouse_name=request.spouse_name,
        spouse_age=request.spouse_age,
        spouse_annual_income=request.spouse_annual_income,
        number_of_dependents=request.number_of_dependents,
        dependent_ages=request.dependent_ages,
        has_elderly_parents=request.has_elderly_parents,
        # Employment
        employment_status=request.employment_status,
        employer=request.employer,
        job_title=request.job_title,
        industry=request.industry,
        # Life stage
        life_stage=request.life_stage,
        expected_retirement_age=request.expected_retirement_age,
        years_to_retirement=request.years_to_retirement,
        # Financials
        annual_income=request.annual_income,
        household_income=request.household_income or request.annual_income,
        net_worth=request.net_worth,
        investable_assets=request.investable_assets,
        monthly_expenses=request.monthly_expenses,
        monthly_debt_payments=request.monthly_debt_payments,
        emergency_fund_months=request.emergency_fund_months,
        has_mortgage=request.has_mortgage,
        mortgage_balance=request.mortgage_balance,
        student_loan_balance=request.student_loan_balance,
        total_debt=request.total_debt,
        # Risk profile
        risk_profile=RiskProfile(
            tolerance=request.risk_tolerance,
            risk_capacity=request.risk_capacity,
            investment_horizon_years=request.investment_horizon_years,
        ),
        # Tax profile (from quick-intake fields)
        tax_profile=TaxProfile(
            has_401k=request.has_401k,
            retirement_contribution_annual=request.retirement_contribution_annual,
            ira_balance=request.ira_balance,
            roth_ira_balance=request.roth_ira_balance,
            hsa_balance=request.hsa_balance,
        ),
        # Insurance (from quick-intake fields)
        insurance=InsuranceCoverage(
            life_insurance_type="term" if request.has_life_insurance else "",
            life_insurance_amount=request.life_insurance_amount,
            disability_insurance=request.has_disability_insurance,
            long_term_care_insurance=request.has_ltc_insurance,
        ),
        # Estate (from quick-intake fields)
        estate_planning=EstatePlanningProfile(
            has_will=request.has_will,
            has_revocable_trust=request.has_trust,
        ),
        status=request.status,
        relationship_start=datetime.now(timezone.utc).date(),
    )

    store = get_cosmos_store()
    await store.save_client(profile.model_dump())

    # Index in search for semantic retrieval
    search = get_search_store()
    await search.upload_document(
        "clients",
        {
            "id": profile.client_id,
            "advisor_id": profile.advisor_id,
            "full_name": profile.full_name,
            "email": profile.email,
            "net_worth": profile.net_worth,
            "risk_tolerance": profile.risk_profile.tolerance.value,
            "content": f"{profile.full_name} {profile.email} {request.notes}",
        },
    )

    logger.info("client_created client_id=%s advisor=%s", profile.client_id, request.advisor_id)
    return {"client_id": profile.client_id, "status": "created", "name": profile.full_name}


@router.get("", response_model=list)
async def list_clients(
    advisor_id: str = Query(..., description="Advisor's user ID"),
    search: str = Query(default="", description="Optional semantic search query"),
) -> list[dict[str, Any]]:
    """List clients for a given advisor, with optional semantic search."""
    if search.strip():
        search_store = get_search_store()
        return await search_store.search_clients(search, advisor_id=advisor_id)

    store = get_cosmos_store()
    clients = await store.list_clients_for_advisor(advisor_id)
    return [_normalize_client(c) for c in clients]


@router.get("/{client_id}", response_model=dict)
async def get_client(
    client_id: str,
    advisor_id: str = Query(...),
) -> dict[str, Any]:
    """Retrieve a client profile."""
    store = get_cosmos_store()
    client = await store.get_client(client_id, advisor_id)
    if not client:
        raise HTTPException(404, "Client not found")
    return _normalize_client(client)


@router.put("/{client_id}", response_model=dict)
async def update_client(
    client_id: str,
    updates: dict[str, Any],
    advisor_id: str = Query(...),
) -> dict[str, Any]:
    """Update client profile fields."""
    store = get_cosmos_store()
    client = await store.get_client(client_id, advisor_id)
    if not client:
        raise HTTPException(404, "Client not found")

    # Prevent overriding critical fields
    updates.pop("client_id", None)
    updates.pop("advisor_id", None)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    client.update(updates)
    await store.save_client(client)
    return {"status": "updated", "client_id": client_id}


@router.post("/{client_id}/risk", response_model=dict)
async def update_risk_profile(
    client_id: str,
    request: UpdateRiskProfileRequest,
    advisor_id: str = Query(...),
) -> dict[str, Any]:
    """Update the client's risk profile. Triggers re-assessment record."""
    from datetime import datetime, timezone

    store = get_cosmos_store()
    client = await store.get_client(client_id, advisor_id)
    if not client:
        raise HTTPException(404, "Client not found")

    risk = RiskProfile(
        tolerance=request.tolerance,
        investment_horizon_years=request.investment_horizon_years,
        max_drawdown_tolerance=request.max_drawdown_tolerance,
        equity_allocation_target=request.equity_allocation_target,
        fixed_income_target=request.fixed_income_target,
        alternatives_target=request.alternatives_target,
        assessed_at=datetime.now(timezone.utc),
        assessed_by=request.assessed_by,
        questionnaire_responses=request.questionnaire_responses,
    )

    client["risk_profile"] = risk.model_dump()
    client["updated_at"] = datetime.now(timezone.utc).isoformat()
    await store.save_client(client)

    logger.info("risk_profile_updated client_id=%s tolerance=%s", client_id, request.tolerance)
    return {"status": "updated", "risk_profile": risk.model_dump()}


@router.get("/{client_id}/meetings", response_model=list)
async def get_client_meetings(client_id: str) -> list[dict[str, Any]]:
    """Get all meeting sessions for a client."""
    store = get_cosmos_store()
    return await store.list_sessions_for_client(client_id)


@router.get("/{client_id}/portfolios", response_model=list)
async def get_client_portfolios(client_id: str) -> list[dict[str, Any]]:
    """Get all portfolio proposals for a client."""
    store = get_cosmos_store()
    return await store.list_portfolios_for_client(client_id)


@router.post("/{client_id}/merge-profile", response_model=dict)
async def merge_profile_from_meeting(
    client_id: str,
    session_id: str,
    advisor_id: str = Query(...),
) -> dict[str, Any]:
    """
    Merge profile extractions from a completed meeting into the client's profile.
    Called after advisor reviews and approves meeting summary.
    """
    store = get_cosmos_store()
    client = await store.get_client(client_id, advisor_id)
    if not client:
        raise HTTPException(404, "Client not found")

    # Sessions for promoted prospects are partitioned under prospect-XXXXXXXX,
    # so we cannot use get_session(session_id, client_id) directly.
    # Use a cross-partition query by session_id or linked_client_id instead.
    sessions = await store.query(
        "sessions",
        "SELECT * FROM c WHERE c.session_id = @sid OR c.linked_client_id = @cid OR c.client_id = @cid",
        [{"name": "@sid", "value": session_id}, {"name": "@cid", "value": client_id}],
        max_items=1,
    )
    if not sessions:
        raise HTTPException(404, "Meeting session not found")
    session = sessions[0]

    extractions = session.get("profile_extractions", {})
    if not extractions:
        return {"status": "no_extractions", "message": "No profile extractions found in session"}

    # Apply extracted metadata to the client profile
    if extractions.get("extracted_concerns"):
        existing = set(client.get("extracted_concerns", []))
        existing.update(extractions["extracted_concerns"])
        client["extracted_concerns"] = list(existing)

    if extractions.get("extracted_life_events"):
        existing = set(client.get("extracted_life_events", []))
        existing.update(extractions["extracted_life_events"])
        client["extracted_life_events"] = list(existing)

    if extractions.get("extracted_preferences"):
        current_prefs = client.get("extracted_preferences", {})
        current_prefs.update(extractions["extracted_preferences"])
        client["extracted_preferences"] = current_prefs

    if extractions.get("key_action_items"):
        # Merge action items (deduplicate by text)
        existing_actions = set(client.get("next_actions", []))
        existing_actions.update(extractions["key_action_items"])
        client["next_actions"] = list(existing_actions)

    # Merge goals extracted during the meeting
    if extractions.get("extracted_goals"):
        existing_goals: list[dict] = client.get("goals") or []
        existing_names = {g.get("name", "") for g in existing_goals}
        for raw in extractions["extracted_goals"]:
            goal_dict: dict[str, Any] = {}
            if isinstance(raw, dict):
                goal_dict = raw
            else:
                text = str(raw).lower()
                gtype = "retirement"
                if any(w in text for w in ("education", "college", "school", "529")):
                    gtype = "education"
                elif any(w in text for w in ("home", "house", "real estate")):
                    gtype = "home_purchase"
                elif any(w in text for w in ("business", "startup")):
                    gtype = "business_investment"
                elif any(w in text for w in ("estate", "legacy", "inheritance")):
                    gtype = "estate_transfer"
                elif any(w in text for w in ("income", "dividend", "cash flow")):
                    gtype = "income_generation"
                goal_dict = {"goal_type": gtype, "name": str(raw)[:120], "priority": 1}
            name = goal_dict.get("name", goal_dict.get("goal_type", str(raw)))
            if name not in existing_names:
                existing_goals.append(goal_dict)
                existing_names.add(name)
        client["goals"] = existing_goals

    client["last_meeting_at"] = session.get("completed_at")
    client["meeting_count"] = client.get("meeting_count", 0) + 1
    client["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Update financial figures from extraction if the stored values are zero
    # (e.g. client was created from a partial mid-meeting save before these
    # topics came up in the conversation).
    financial = (extractions.get("extracted_financial") or {})

    def _f(d: dict, *keys: str) -> float:
        for k in keys:
            v = d.get(k)
            if v is not None:
                try:
                    return float(str(v).replace(",", "").replace("$", ""))
                except (ValueError, TypeError):
                    pass
        return 0.0

    if not client.get("annual_income"):
        v = _f(financial, "annual_income", "income", "salary")
        if v: client["annual_income"] = v
    if not client.get("net_worth"):
        v = _f(financial, "net_worth", "total_net_worth")
        if v: client["net_worth"] = v
    if not client.get("monthly_expenses"):
        v = _f(financial, "monthly_expenses", "expenses")
        if v: client["monthly_expenses"] = v
    if not client.get("investable_assets"):
        v = _f(financial, "investable_assets", "aum", "liquid_assets")
        if v: client["investable_assets"] = v

    # Also sync aum (frontend alias for investable_assets)
    if not client.get("aum") and client.get("investable_assets"):
        client["aum"] = client["investable_assets"]

    # Update risk tolerance if not yet set
    risk_data = extractions.get("extracted_risk") or {}
    if risk_data.get("tolerance") and not client.get("risk_profile", {}).get("tolerance"):
        rp = client.setdefault("risk_profile", {})
        rp["tolerance"] = risk_data["tolerance"]

    await store.save_client(client)
    return {"status": "merged", "fields_updated": list(extractions.keys())}


@router.delete("/{client_id}", response_model=dict)
async def delete_client(
    client_id: str,
    advisor_id: str = Query(...),
) -> dict[str, Any]:
    """Cascade-delete a client and all associated data."""
    store = get_cosmos_store()
    counts = await store.delete_client_cascade(client_id, advisor_id)
    if counts is None:
        raise HTTPException(404, "Client not found")
    logger.info("client_deleted client_id=%s advisor=%s", client_id, advisor_id)
    return {"status": "deleted", "client_id": client_id, "deleted_counts": counts}
