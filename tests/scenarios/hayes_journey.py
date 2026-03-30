"""
Robert & Linda Hayes — Multi-Meeting Journey (Meetings 2 through 6)

Building on the initial prospecting meeting (ROBERT_LINDA_HAYES in profiles.py),
this module captures the full arc of the Hayes couple's relationship with their
advisor over approximately 24 months:

  M2  Onboarding / Retirement Blueprint      Jan 2024  — 2 weeks after M1
  M3  Robert's Health Scare                  Oct 2024  — cardiac event, early-retire?
  M4  Linda Takes the Wheel                  Mar 2025  — Linda decides to retire early
  M5  Annual Review                          Jul 2025  — 18 months in, 18 months out
  M6  Robert's Last Day                      Jan 2026  — Robert retires, Medicare, pension

Key themes across the arc:
  - Mortality and health forcing abstract planning to become concrete
  - Social Security delay strategy tested under real emotional pressure
  - Healthcare bridge: the single biggest pre-Medicare cost surprise
  - Pension + SS income sequencing — which levers to pull in what order
  - Linda's independence growing as she becomes the primary financial voice
  - Combined 403b: $680K -> $810K -> (Robert stops contributing) -> retirement draw
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# MEETING 2  —  Onboarding / Retirement Blueprint Session
# Date: mid-January 2024 (~2 weeks after M1)
# Meeting type: onboarding
# Context: Both Robert and Linda attend. Advisor presents the full retirement
#   blueprint: SS optimization, ACA healthcare bridge plan, 403b withdrawal
#   sequencing, Roth conversion ladder, and updated will/beneficiary review.
#   Sentiment: attentive and slightly anxious, resolving into focused optimism.
# ---------------------------------------------------------------------------
HAYES_M2_ONBOARDING = [
    {"speaker": "advisor", "text": "Robert, Linda — great to have you both back. Since our first meeting I've done a thorough analysis of your situation. Seven years to retirement for Robert, nine for Linda, plenty of runway but some critical decisions to get right. Let's walk through it."},
    {"speaker": "client",  "text": "We've been talking about it all week. Linda especially had a lot of questions — I told her to bring them all today."},
    {"speaker": "client",  "text": "I wrote them down. I have a full page. The biggest one is healthcare — we both lose school district coverage the moment we retire. That terrifies me more than anything else."},
    {"speaker": "advisor", "text": "Linda, that is the right thing to be focused on. Healthcare is the number one budget wildcard for people who retire before Medicare at sixty-five. Here's what I've modeled. If Robert retires at sixty-five, he's Medicare-eligible on day one — no gap. But Linda, at sixty-two or sixty-three, you'd have two to three years on the ACA Marketplace. Based on your projected income in early retirement, your premium after subsidy would be approximately eleven hundred to fourteen hundred dollars per month for a silver plan for just you."},
    {"speaker": "client",  "text": "Eleven hundred a month. I knew it would be expensive but that is a real number. That's more than our car payments combined."},
    {"speaker": "client",  "text": "I'll be fine on Medicare. But I don't want Linda's healthcare to derail our retirement budget. Can we afford that?"},
    {"speaker": "advisor", "text": "Let's look at the full income picture once both are retired. Robert, your pension is two thousand eight hundred per month starting at sixty-five. Social Security — and this is the critical recommendation I want to spend time on — I am strongly recommending you delay Social Security until seventy. At your earnings history, your benefit at sixty-seven would be two thousand six hundred fifty. At seventy, it becomes three thousand three hundred eighty. That's a seven hundred thirty dollar monthly difference, for life, and it inflates with CPI every year."},
    {"speaker": "client",  "text": "That's a significant difference. But I'll be sixty-five to seventy — how do we pay for those five years without taking Social Security?"},
    {"speaker": "advisor", "text": "That's exactly the right question. The bridge is your 403b accounts. Between your two accounts you have six hundred eighty thousand dollars today and seven years of continued contributions. My projection has you at eight hundred thirty thousand at Robert's retirement date. Drawing sixty thousand per year from the 403b for five years while both pensions are active covers the income gap. The math works — and then at seventy, the higher Social Security locks in your inflation-protected income for the rest of your lives."},
    {"speaker": "client",  "text": "So we're essentially buying a much higher Social Security payment for the rest of our lives by waiting. I had never thought of it as a purchase before."},
    {"speaker": "advisor", "text": "That's exactly the right mental model. You're effectively buying a cost-of-living-adjusted annuity from the Social Security Administration at a very competitive rate. For a couple in good health at sixty-five, the breakeven is typically around age seventy-seven. Beyond that, you're ahead — every month for the rest of your lives. Linda — your SS estimate at sixty-seven is one thousand eight hundred per month. I'm recommending the same delay to sixty-seven on the dot rather than taking it early. The actuarial math strongly favors waiting given your health."},
    {"speaker": "client",  "text": "And I can claim as a spousal benefit off Robert's record at some point too — I remember reading about that."},
    {"speaker": "advisor", "text": "You can, yes, if Robert has filed. Given the numbers, filing on your own record at sixty-seven is more beneficial than spousal — but we'll confirm that as we get closer. The full spousal benefit would be fifty percent of Robert's benefit, which at his age and history is approximately one thousand six hundred. Your own benefit exceeds that, so your own record wins."},
    {"speaker": "client",  "text": "Good. What about our wills — you mentioned last time they're from 2009. Fifteen years of changes."},
    {"speaker": "advisor", "text": "Urgent priority. Your home is paid off and worth seven hundred fifty thousand. Your combined 403b is approaching seven hundred thousand. That's well over a million dollars in assets with fifteen-year-old estate documents. I'm going to send you a referral to an estate attorney this week. Two things need to happen: updated wills naming each other as primary beneficiaries with adult children as contingent, and a healthcare proxy and durable power of attorney for each of you. This is not a nice-to-have."},
    {"speaker": "client",  "text": "We've been meaning to do it since 2015. We'll actually do it this time. What's the cost?"},
    {"speaker": "advisor", "text": "For a straightforward update with no trust structure needed — probably eighteen hundred to twenty-four hundred dollars total for both of you. Very manageable. The bigger issue would be continuing to have outdated documents on assets this size."},
    {"speaker": "client",  "text": "I also want to ask — my sister keeps telling me Robert needs long-term care insurance. Is she right?"},
    {"speaker": "advisor", "text": "At fifty-eight, it is worth evaluating. The premiums are substantially lower now than if you wait to sixty-three or sixty-four. The challenge is that traditional LTC policies have seen significant premium increases in recent years. What I'm recommending is a hybrid life insurance and LTC policy — you get death benefit if you never need care, and LTC coverage if you do. It's more predictable than traditional LTC premiums. I want to bring a quote to our next meeting."},
    {"speaker": "client",  "text": "That sounds sensible. Robert has been resistant to talking about LTC because he doesn't want to think about needing it. But his father had Parkinson's and needed care for five years. The cost was devastating to his mother."},
    {"speaker": "client",  "text": "I know. My father's situation is exactly why I've avoided the conversation. But Linda is right that we need to address it."},
    {"speaker": "advisor", "text": "Robert, the fact that you've experienced a family member needing long-term care firsthand is actually the strongest argument for having the coverage. I'll bring quotes next time. For now — summary of today: SS delayed to seventy, healthcare bridge budget built, estate documents initiated, hybrid LTC quote coming. This is a solid seven-year runway."},
]

# ---------------------------------------------------------------------------
# MEETING 3  —  Robert's Health Scare  (client-initiated, urgent)
# Date: October 2024 (~9 months after onboarding)
# Meeting type: portfolio_review (rescheduled as ad-hoc urgency)
# Context: Robert had an abnormal cardiac stress test in September and
#   underwent a cardiac catheterization that found 70% blockage. Stents
#   placed; he is recovering. His cardiologist recommended "significant stress
#   reduction." At 59, Robert is now seriously considering retiring at 63
#   instead of 65 — two years earlier than the plan. Linda called to schedule.
#   Sentiment: fear → measured resolve → cautious optimism; Linda is calm and
#   analytical, Robert is quieter than usual.
# ---------------------------------------------------------------------------
HAYES_M3_HEALTH_SCARE = [
    {"speaker": "advisor", "text": "Robert, Linda — thank you for calling me when this happened. Robert, first — how are you feeling? You look better than I feared."},
    {"speaker": "client",  "text": "Better than two weeks ago. The stents are in, the cardiologist says the procedure went well. I'm on blood thinners and cholesterol medication now. Cardiac rehab starts next month."},
    {"speaker": "client",  "text": "He scared the life out of me. He turned gray during a morning run and I drove him to the ER. I need to know the financial picture if things change. I need to know we're okay."},
    {"speaker": "advisor", "text": "Linda, you are okay, and we're going to walk through every scenario right now. Robert — your cardiologist mentioned stress reduction. Has he said anything specific about work?"},
    {"speaker": "client",  "text": "He said I should think about reducing my schedule. The school year is genuinely stressful — behavioral issues have gotten worse in the last few years and I handle the district's most challenging students. I'm thinking sixty-three instead of sixty-five. Two years earlier than our plan."},
    {"speaker": "advisor", "text": "I ran this scenario as soon as Linda's message came in. Let me show you the numbers. Retiring at sixty-three instead of sixty-five means two fewer years of 403b contributions at your current rate — that's approximately sixty-two thousand dollars in contributions plus growth you don't capture — and two more years of bridge spending before Medicare. Let me walk through each impact."},
    {"speaker": "client",  "text": "How much does it change the overall picture?"},
    {"speaker": "advisor", "text": "The 403b at sixty-three projects to seven hundred sixty thousand instead of the original eight hundred thirty thousand. That's seventy thousand less. On Social Security — delaying to seventy still makes strong actuarial sense, but if health concerns make you want to reconsider that, claiming at sixty-seven saves you two years of bridge withdrawals. Let me model both."},
    {"speaker": "client",  "text": "I want to know what I can afford. If I retire at sixty-three and we live simply, can we do it?"},
    {"speaker": "advisor", "text": "Yes. Here is the conservative case. Robert's pension starts at sixty-three — assuming the district allows early pension collection at sixty-three, which I need you to confirm with HR. That's two thousand eight hundred per month. Linda, your income continues — sixty-three thousand per year with annual step increases. Total household income from those two sources: ninety-five thousand. Your modeled spending is ninety-five thousand. You break even before touching any savings."},
    {"speaker": "client",  "text": "We'd be literally living on pension and my salary with nothing left over. But the retirement accounts keep growing."},
    {"speaker": "advisor", "text": "The retirement accounts grow untouched until Robert claims Social Security. At seventy, that adds three thousand three hundred eighty per month — forty thousand a year — and simultaneously the bridge withdrawals stop. At that point you have a substantial surplus and the savings are all upside. Robert, you'd have seven years of continued growth in the 403b, compounding without any withdrawals."},
    {"speaker": "client",  "text": "Seven years of compounding without touching it. I actually hadn't mentally modeled that. What about Linda's pension — can she collect early?"},
    {"speaker": "advisor", "text": "Washington PERS allows early retirement as early as age sixty with reduced benefits. At sixty Linda's pension would be approximately one thousand five hundred per month — reduced from the one thousand nine hundred at sixty-two. The reduction is meaningful but not devastating given the full picture."},
    {"speaker": "client",  "text": "What about my healthcare if Robert retires at sixty-three? He goes on Medicare at sixty-five, but I still have school district coverage through my employment. So we're actually fine on healthcare as long as I keep working."},
    {"speaker": "advisor", "text": "Correct — Linda, while you're employed you keep your school district coverage. You could add Robert to your plan, which will cost more than his current employee coverage, but dramatically less than the ACA marketplace. That is actually a significant financial advantage of staggering your retirements by two years."},
    {"speaker": "client",  "text": "So if Robert retires at sixty-three and I stay until sixty-two, his healthcare is covered on my school plan. I never thought about it as a benefit of me staying longer."},
    {"speaker": "client",  "text": "I hadn't either. Linda staying two more years might actually be financially better for both of us than I assumed. I went into this expecting bad news."},
    {"speaker": "advisor", "text": "The health event is genuinely serious and I don't want to minimize that. But the financial picture for an early retirement at sixty-three is workable. The main adjustment is confirming the pension timing with HR, keeping the Social Security delay, and ensuring Robert has something meaningful to do in retirement — retirement research consistently shows that health outcomes are better when retirement has structure and purpose. Set up that cardiac rehab schedule and build from there."},
    {"speaker": "client",  "text": "He's already talking about coaching the middle school track team. He's been mentoring kids for thirty years. That's his purpose."},
    {"speaker": "client",  "text": "It's either coaching or becoming Linda's personal assistant. One of those is better for both of us."},
    {"speaker": "advisor", "text": "I'll update the retirement model to reflect age sixty-three and send you both a revised projection by the end of the week. We'll schedule a formal planning session in January to finalize the decision timeline. For now, Robert — focus on the recovery and the rehab. The financial plan bends. It doesn't break."},
]

# ---------------------------------------------------------------------------
# MEETING 4  —  Linda Takes the Wheel  (Linda's retirement decision)
# Date: March 2025 (~14 months after onboarding)
# Meeting type: planning
# Context: Robert is 60, recovered well and is planning to retire at 63 (three
#   years away). Linda is 58 and surprises everyone — she wants to retire at 61,
#   not 62-63 as originally planned. One more year of school feels right to her.
#   They also want to take a big trip — an Alaskan cruise — in Robert's first
#   summer of retirement. Will and LTC progress check.
#   Sentiment: Linda is confident and decisive; Robert is delighted.
# ---------------------------------------------------------------------------
HAYES_M4_LINDA_RETIREMENT = [
    {"speaker": "advisor", "text": "Robert, you look great — the cardiac rehab has clearly done its job. Linda, you called and said you had news. I'm curious."},
    {"speaker": "client",  "text": "I've decided to retire at sixty-one. One more year after this one, then I'm done. I spent twenty-nine years in the classroom and I love my students, but after Robert's health scare I realized we've been deferring life. I want to retire while we're still healthy enough to actually enjoy it."},
    {"speaker": "client",  "text": "I have never been happier to be overruled on a financial timeline."},
    {"speaker": "advisor", "text": "Linda, that is a meaningful shift and I want to make sure we plan around it carefully. At sixty-one, your pension at the early reduction rate would be approximately one thousand four hundred per month. Robert's pension starts at sixty-three — so there are two years where you're both retired on reduced pension income before Robert's kicks in. Walk me through what you're envisioning for those two years."},
    {"speaker": "client",  "text": "We've talked about it a lot. We've been savers our whole careers. Between our 403b accounts and the paid-off house, we feel like we can dip into savings for a few years without feeling the permanent damage people worry about."},
    {"speaker": "advisor", "text": "You're right that a two-year bridge withdrawal from the 403b is manageable. At Linda's retirement in June 2026, your combined 403b balance should be approximately eight hundred ten thousand. If you draw fifty-five thousand per year for two years while you're both retired but before Robert's pension starts, you'd only reduce the 403b by about one hundred fifteen thousand accounting for continued growth. That's a much smaller dent than most people fear."},
    {"speaker": "client",  "text": "And we don't need fifty-five thousand a year in withdrawals — between Linda's pension at fourteen hundred per month and Robert's part-time track coaching stipend — it's small but it matters — we might only need forty thousand from savings."},
    {"speaker": "advisor", "text": "That's even better. Forty thousand over two years from an eight-hundred-thousand-dollar pool is very conservative. Linda — the bigger issue at sixty-one is healthcare again. You lose school district coverage. Robert is sixty-three at that point, not yet Medicare-eligible. You'd both be on the ACA marketplace."},
    {"speaker": "client",  "text": "I've looked at this. With our income from pensions and 403b withdrawals structured properly, we should qualify for meaningful ACA subsidies. I read that if you keep MAGI below a threshold, the premiums are manageable."},
    {"speaker": "advisor", "text": "You've done your homework. If you keep your total income — pension plus 403b withdrawals — at a specific level, you can qualify for enhanced ACA subsidies. For a couple in your sixties with no employer income, I can target a joint premium of approximately fourteen to eighteen hundred per month for a good silver plan. That needs to be in the budget, but it's not catastrophic."},
    {"speaker": "client",  "text": "Eighteen hundred a month on healthcare is a lot. But when I compare it to the cost of continuing to work jobs that are stressing Robert's heart and grinding me down — it's worth it."},
    {"speaker": "client",  "text": "There is no amount of money that is worth what the last health scare cost us emotionally. Linda is right."},
    {"speaker": "advisor", "text": "I think you're both right, and I want to support that decision thoughtfully. Let me build an updated retirement income model with Linda at sixty-one and Robert at sixty-three, ACA premiums baked in, and the Social Security delay held at seventy for Robert and sixty-seven for Linda. I want to show you an annual budget for years one through fifteen visually — so you both see exactly what each year looks like."},
    {"speaker": "client",  "text": "I would love that. A year-by-year picture. That's what I've been trying to build on a spreadsheet but it keeps getting too complicated."},
    {"speaker": "advisor", "text": "We'll have that ready in two weeks. One more important item — the will and estate documents. Did you connect with the attorney I referred you to last January?"},
    {"speaker": "client",  "text": "We did. We met with her in November. Wills are updated, healthcare proxies are done, durable powers of attorney are signed. We updated the 403b beneficiaries to each other and put our son and daughter as contingent equally."},
    {"speaker": "advisor", "text": "That is excellent progress — you checked a very important box. And the hybrid LTC policy — we sent you quotes in February. Did you review them?"},
    {"speaker": "client",  "text": "We did. We're going with the joint life hybrid policy — the four thousand eight hundred per year premium for both of us. Robert's father's situation made this a non-negotiable. We'd rather pay now than burden our kids later."},
    {"speaker": "advisor", "text": "That is a very wise decision and I'm glad you moved on it at fifty-eight and sixty. The premium locks in at this age — waiting even three more years would increase the annual cost by roughly thirty to forty percent. Alright — updated model in two weeks, and then let's plan to meet in July for a full annual review. Robert, any chance you're thinking about what retirement actually looks like?"},
    {"speaker": "client",  "text": "We've already booked an Alaskan cruise for August 2027 — Robert's first summer of retirement. We've been talking about that trip for twenty years. It's happening."},
    {"speaker": "client",  "text": "I've been told the deposit is non-refundable. So now I have to retire."},
]

# ---------------------------------------------------------------------------
# MEETING 5  —  Annual Review  (18 months in, both nearing retirement)
# Date: July 2025 (~18 months after onboarding)
# Meeting type: annual_review
# Context: Robert is 60, 3 years from retirement. Linda is 59, 2 years from
#   retirement. Portfolio has grown nicely. SS strategy confirmed. Roth
#   conversion opportunity identified. Alaska trip down payment in savings.
#   Robert's health is fully stable — best checkup in two years.
#   Sentiment: settled contentment, occasional wistfulness about "the last lap."
# ---------------------------------------------------------------------------
HAYES_M5_ANNUAL_REVIEW = [
    {"speaker": "advisor", "text": "Robert, Linda — eighteen months together. This is your first formal annual review and I have to say, the numbers are in very good shape. Let me take you through it."},
    {"speaker": "client",  "text": "I've been looking forward to this. Robert had his cardiac checkup last month — doctor says his arteries are clear and his numbers are the best they've been in five years. I finally slept through the night again."},
    {"speaker": "client",  "text": "Apparently a near-death experience and cardiac rehab are an effective weight loss program. Down eighteen pounds. Who knew."},
    {"speaker": "advisor", "text": "That is genuinely wonderful news, Robert. Health is the foundation of every retirement plan — the best financial projection in the world depends on you being around to live it. Now — to the numbers. Your combined 403b accounts are at eight hundred twelve thousand dollars, up approximately one hundred thirty-two thousand from where we started. That includes contributions, investment returns, and beneficiary from a small amount of tax-loss harvesting I executed in October."},
    {"speaker": "client",  "text": "Eight hundred twelve thousand. We started at six hundred eighty thousand and the plan seemed aggressive. That is meaningful growth."},
    {"speaker": "advisor", "text": "Your allocation is thirty percent equities and seventy percent fixed income and alternatives — very conservative, as you wanted. In a year where equities were up about fourteen percent, the conservative allocation meant you only captured about five percent of that upside. But you slept better, and the stability is what you need in the three-to-five-year runway to retirement. That's the tradeoff you deliberately chose."},
    {"speaker": "client",  "text": "I want to ask something I've been thinking about. Should we shift a little more into equities since Robert is healthier and we might have a longer horizon than we feared after the health scare?"},
    {"speaker": "advisor", "text": "That's a mature and financially sensible question. With a three-year window to Robert's retirement and your plan requiring these funds for potentially thirty or more years, I'm comfortable moving from thirty percent equity to thirty-eight or forty percent equity. I'd do it gradually — quarterly rebalances over six months — and keep the fixed income allocation in short and intermediate bonds to manage interest rate risk."},
    {"speaker": "client",  "text": "Let's do that. Thirty-eight percent equity feels right. Linda?"},
    {"speaker": "client",  "text": "Agreed. The plan was always conservative out of anxiety. The anxiety is lower now. The goal is thirty years of retirement income, not just the next three years."},
    {"speaker": "advisor", "text": "I'll update the allocation target to thirty-eight percent equity and begin the transition. Now — a strategy I want to introduce that we haven't discussed yet. Roth conversions. Robert, you're currently in the twenty-two percent federal bracket. When you retire in three years, your income will drop substantially before Social Security starts at seventy — that creates a rate window. I want to do small Roth conversions in years one through four of your retirement, while you're in a very low bracket, and let that money grow tax-free for the rest of your lives."},
    {"speaker": "client",  "text": "How much should we convert each year and what's the tax cost?"},
    {"speaker": "advisor", "text": "The target is to fill the twelve percent federal bracket each year — approximately fifteen to eighteen thousand dollars per year in conversions. At twelve percent federal and Washington having no state income tax, the tax cost is roughly eighteen hundred to twenty-two hundred per year. The long-term benefit is that Roth assets have no required minimum distributions and qualified withdrawals are tax-free. Over twenty years, this strategy could save you forty to sixty thousand dollars in lifetime taxes."},
    {"speaker": "client",  "text": "Eighteen hundred a year now to save forty to sixty thousand over our lifetimes. That seems obviously correct."},
    {"speaker": "advisor", "text": "It is a highly compelling trade in your situation. We'll start the conversions in Robert's first year of retirement. One last item — the Alaska cruise in August 2027. I see you have eight thousand in the travel savings account. Outstanding balance on the cruise?"},
    {"speaker": "client",  "text": "We have about six thousand left to pay. It's due in April 2027, which is two months after Robert's pension starts. The timing works perfectly."},
    {"speaker": "advisor", "text": "Perfect. That trip is in the budget and fully funded between now and then. Robert, Linda — you came in eighteen months ago with a plan. You've followed it through a health scare, an early retirement decision — two of them actually — and a significant life reframe. The plan held up. That matters."},
    {"speaker": "client",  "text": "I never thought I'd say this, but I'm actually excited about retirement now. Not scared. A year ago I would have said the opposite."},
    {"speaker": "client",  "text": "She made the spreadsheet. I made peace with mortality. Between the two of us we've got it covered."},
]

# ---------------------------------------------------------------------------
# MEETING 6  —  Robert's Last Day  (retirement day check-in)
# Date: January 2026 (~24 months after onboarding)
# Meeting type: planning
# Context: Robert's last day of school is January 31, 2026. He turns 61 in
#   February. Pension starts February 1st. Medicare Part A effective
#   immediately (he's 61, not 65 — he needs to wait). Actually — Robert is 61
#   in 2026, not 65. He's 4 years from Medicare. Linda adds him to her school
#   plan. Social Security still being held to 70. Linda still working.
#   Final year-by-year income model walkthrough. Emotional closure on the
#   "pre-retirement" chapter. The Alaska cruise is 18 months away.
# ---------------------------------------------------------------------------
HAYES_M6_ROBERT_RETIRES = [
    {"speaker": "advisor", "text": "Robert — I heard from Linda that tomorrow is your last official day with the Bellevue school district. After thirty-two years. I wanted to have this meeting today so you walk out tomorrow with complete clarity about what comes next."},
    {"speaker": "client",  "text": "Thirty-two years, four months, and about two hundred eighty-three difficult Mondays. Not that I was counting. I'm ready."},
    {"speaker": "client",  "text": "He's been ready for three months. He has a daily schedule drafted for his first week of retirement. It includes napping twice. I'm not retired yet so I find this unfair."},
    {"speaker": "advisor", "text": "Linda, you have twenty-two months until your retirement date. Let's make sure Robert's transition is set up correctly so that when your turn comes, it's just a repeat of this process. Robert — pension paperwork?"},
    {"speaker": "client",  "text": "Submitted in November. HR confirmed my first pension check will be deposited February first. Two thousand eight hundred and forty dollars — slightly higher than the original two thousand eight hundred estimate because of the salary increases I received this last year."},
    {"speaker": "advisor", "text": "Excellent — that extra forty dollars per month compounds nicely as a lifetime baseline. Medicare — Robert, you're sixty-one in February. Medicare eligibility is sixty-five, so we have a four-year gap. You're joining Linda's school district plan as a dependent. Did you confirm that enrollment?"},
    {"speaker": "client",  "text": "HR has the forms. Linda's plan adds dependents during the open enrollment period and we submitted in November. Starting February first, I'm on her school plan. The premium increase for adding me is two hundred forty dollars per month — we already factored it into the retirement budget."},
    {"speaker": "advisor", "text": "Perfect execution. You've removed the biggest healthcare risk that stops most early retirees. When Linda retires in November 2027, you'll have twenty-two months before you turn sixty-five and hit Medicare. That's the remaining gap window we'll plan for when we get closer. For now, let's walk through what the next thirty-six months look like month by month."},
    {"speaker": "client",  "text": "That visual was the thing that made this feel real. I printed the one you sent last year and taped it inside my planner."},
    {"speaker": "advisor", "text": "For the record: February 2026 through January 2028 — Robert's retirement, Linda still working. Monthly household income: Robert's pension two thousand eight hundred forty, plus Linda's after-tax salary approximately four thousand two hundred. Total income roughly seven thousand per month. Monthly expenses — mortgage is paid, utilities, food, healthcare premium at two hundred forty: we're projecting forty-six hundred per month in core expenses. You have a surplus of over twenty-four hundred per month."},
    {"speaker": "client",  "text": "A surplus of twenty-four hundred. I've been budgeting like we'd be tight. That number surprises me."},
    {"speaker": "advisor", "text": "You've been conservative savers for thirty years and you have no mortgage. That discipline created this cushion. The surplus goes into three buckets: the Alaska cruise savings account gets topped up, we add to the travel fund for future adventures, and the remainder goes into a short-term bond account I want to build as a one-year liquid buffer before Linda retires."},
    {"speaker": "client",  "text": "The coaching stipend from the middle school track program — I found out it's two thousand two hundred for the spring season. Small but real."},
    {"speaker": "advisor", "text": "Add that to the surplus — it's one hundred eighty-three a month annualized. More importantly, from a health and psychology standpoint, keeping structure and staying connected to young people is exactly what the research says leads to longer, healthier retirements. The stipend is nice. The purpose is the real value."},
    {"speaker": "client",  "text": "He already has twelve kids signed up to train with him. He called them all personally. I overheard the conversations. He'll never fully retire."},
    {"speaker": "client",  "text": "They're good kids. They just need someone who shows up. Thirty-two years of teaching and that's the lesson I keep coming back to: show up."},
    {"speaker": "advisor", "text": "Robert, that mindset is going to serve you well in retired life. Social Security — we're holding to seventy, which is nine years away. That is confirmed and unchanged?"},
    {"speaker": "client",  "text": "Confirmed. We ran the break-even math again over dinner last month. At our health baseline, waiting to seventy is worth it. If anything were to change, we'd revisit. But for now, seventy is the target."},
    {"speaker": "advisor", "text": "Nine years of 403b compounding without withdrawals. By the time you claim at seventy, I'm projecting your combined 403b to be approximately one point one million dollars — assuming a conservative five percent annual growth. That is the asset that funds the back half of your retirement. For now, it just grows. I'll schedule a check-in for June, three months after Linda gets her final salary bump — I want to see if the surplus is tracking as projected. Any last questions before you walk out of that building tomorrow?"},
    {"speaker": "client",  "text": "Just one. Is there anything I should be doing in my first month of retirement that most people forget?"},
    {"speaker": "advisor", "text": "Change your 403b beneficiaries to reflect current wishes now that you're retired. Update your address with PERS for pension correspondence. And give yourself genuine permission to do nothing for the first two weeks. The most common mistake new retirees make is filling every minute immediately. The open calendar is not a problem to solve. It's the reward."},
    {"speaker": "client",  "text": "Two weeks of nothing. Linda has already put 'be retired' on my calendar block for those weeks."},
    {"speaker": "client",  "text": "I've worked with kindergarteners for twenty-nine years. I know how to manage unstructured time. His nap schedule is a starting point, not a final draft."},
]
