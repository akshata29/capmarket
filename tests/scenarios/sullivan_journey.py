"""
George & Patricia Sullivan — Multi-Meeting Journey (Meetings 2 through 6)

Building on the initial prospecting meeting (GEORGE_PATRICIA_SULLIVAN in profiles.py),
this module captures the Sullivans' journey through the early years of retirement —
moving from anxiety about their equity-heavy allocation to a settled, confident
income plan — punctuated by major life transitions and a sobering long-term care
awakening:

  M2  Onboarding / Rebalancing + Income Ladder         Jan 2024  — 3 weeks after M1
  M3  Patricia Fully Retires                           Jul 2024  — surprise acceleration
  M4  La Jolla Condo Sale Decision                     Feb 2025  — housing inflection point
  M5  Annual Review / First Full Retired Year          Jun 2025  — reality check on spending
  M6  Long-Term Care Conversation                      Jan 2026  — Patricia's mother triggers

Key themes:
  - Rebalancing a 78% equity portfolio without a tax catastrophe
  - The income ladder: predictability replaces anxiety
  - Patricia's retirement changes the emotional geometry of the plan
  - The condo sale creates new options AND new decisions
  - Long-term care planning: delayed, but no longer avoidable
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# MEETING 2  —  Onboarding / Rebalancing + Income Ladder
# Date: mid-January 2024 (~3 weeks after M1)
# Meeting type: onboarding
# Context: George (68) and Patricia (64). George retired 3 years ago.
#   Patricia still works part-time ($45K/yr). Portfolio: $3.1M at 78% equity
#   (deeply aggressive for their phase). Spending needs: $130K/year.
#   Current income: George SS $2,650 + pension $1,400 = $4,050/month
#   ($48,600/yr). Gap to fill from portfolio: $81,400/yr.
#   Today: execute the rebalancing plan and set up the income ladder.
#   Both attend. Sentiment: George is cautious, Patricia still somewhat
#   skeptical of the need to change from what worked before.
# ---------------------------------------------------------------------------
SULLIVAN_M2_ONBOARDING = [
    {"speaker": "advisor", "text": "George, Patricia — welcome. I spent three weeks building the clearest possible picture of where you are and where we need to take the portfolio. The short version: your plan is entirely fixable, and we're going to spend today making it systematic. Ready?"},
    {"speaker": "client",  "text": "I am. I want to understand every decision before we make it. I've been a financial decision-avoider for thirty years — keeping the portfolio in growth funds because that's what worked. But the last two years the volatility has genuinely scared me."},
    {"speaker": "client",  "text": "I'm Patricia. I'll be honest — I've been skeptical that rebalancing is as urgent as George believes. We've been at seventy-eight percent equity for most of our investing lives and we did fine."},
    {"speaker": "advisor", "text": "Patricia, that skepticism is understandable and historically informed. You did exactly what you should have done during accumulation: stay in equities, let the portfolio grow. The reason we need to shift now isn't that equity is bad — it's that the risk-reward calculus changes completely when withdrawals begin. A forty percent market correction now doesn't give you fifteen years to recover. It requires selling shares at low prices to fund living expenses. That's sequence-of-returns risk, and it's the primary destroyer of retiree portfolios."},
    {"speaker": "client",  "text": "Can you show me a concrete example? What would a bad year actually look like for us right now?"},
    {"speaker": "advisor", "text": "At three point one million and seventy-eight percent equity, your equity exposure is two point four million. A forty percent correction — like 2008 — reduces that to one point four four million. Your total portfolio drops to two point zero four million. You now need to withdraw eighty-one thousand four hundred from a two million dollar portfolio — a nearly four percent withdrawal rate from a damaged base. Studies show this sequence of events dramatically increases the probability of portfolio depletion over twenty to twenty-five years."},
    {"speaker": "client",  "text": "I didn't think about withdrawals as the variable that makes equity volatility dangerous in retirement versus accumulation. That reframe matters. Okay, I'm listening."},
    {"speaker": "advisor", "text": "Target allocation: fifty percent equity, thirty-five percent fixed income, fifteen percent cash and short-term bonds. This retains meaningful equity upside while building what I call the income ladder."},
    {"speaker": "client",  "text": "What is the income ladder exactly?"},
    {"speaker": "advisor", "text": "We set aside five years of your portfolio withdrawal need — eighty-one thousand four hundred times five equals four hundred seven thousand — in a laddered bond and CD structure. Year one: cash and money market, earning five percent currently. Year two: twelve-month treasuries. Year three: two-year notes. Year four: three-year notes. Year five: four-year notes. When you need to withdraw, you draw from the ladder — not from stocks. Stocks can decline and recover while you live off the ladder. You never have to sell equity at the wrong time."},
    {"speaker": "client",  "text": "I've heard about income floors before but I didn't understand the mechanics. This is actually very elegant. You're creating a buffer between your life and the market."},
    {"speaker": "client",  "text": "George has been sleeping better since we scheduled this meeting. I want him to sleep well because of something real, not because we talked about doing things. So let's actually do it."},
    {"speaker": "advisor", "text": "Here's the execution plan. The portfolio is predominantly held in two IRAs and a taxable account. All the rebalancing in the IRA accounts is tax-free — no capital gains. We move seven hundred thousand of equity funds to bond funds inside the IRAs with zero tax impact. In the taxable account, we have four hundred thousand in appreciated equity — selling that triggers capital gains. We need to spread those sales across tax years to minimize the bracket impact."},
    {"speaker": "client",  "text": "Spread them across how many years?"},
    {"speaker": "advisor", "text": "Two or three years maximizes efficiency. This year we realize one hundred fifty thousand in gains in the taxable account, staying within the zero percent long-term capital gains bracket given your current income level. Next year: another one hundred fifty thousand. The rebalancing is complete by end of 2025 with minimal tax cost."},
    {"speaker": "client",  "text": "Zero percent capital gains bracket? Patricia and I have been paying capital gains taxes for forty years. That is genuinely new information."},
    {"speaker": "advisor", "text": "For 2024, a married couple filing jointly pays zero percent federal long-term capital gains tax on income up to approximately ninety-four thousand dollars. Your current income is eighty-nine thousand — you're inside that bracket. We can harvest substantial gains this year at no tax cost."},
    {"speaker": "client",  "text": "I want to understand: are we lowering our risk profile and actually getting a tax benefit in the process?"},
    {"speaker": "advisor", "text": "Exactly that. The rebalancing is the mechanism; the zero-rate bracket is the gift. Portfolio rebalanced, tax-efficiently, and an income ladder that means the market correction you fear most can't force you to sell a single stock. That's the plan."},
    {"speaker": "client",  "text": "Let's implement. What do you need from us today to start?"},
    {"speaker": "advisor", "text": "I need your custodian account access to execute the IRA trades today, and I'll prepare the specific tax-loss harvesting and gain-realization schedule for your CPA this week. You'll have confirmation of the first trades by tomorrow morning."},
]

# ---------------------------------------------------------------------------
# MEETING 3  —  Patricia Fully Retires
# Date: July 2024 (~6 months after onboarding)
# Meeting type: planning
# Context: Patricia has decided to fully retire, two months ahead of her
#   expected retirement date. She's 64, Medicare is one year away. Her
#   part-time income of $45K/year disappears from the budget. The healthcare
#   coverage through her employer ends in 60 days. She needs an ACA bridge
#   policy and the income plan needs to be recalculated. George is thrilled.
#   Patricia is both excited and nervous about losing her professional identity.
# ---------------------------------------------------------------------------
SULLIVAN_M3_PATRICIA_RETIRES = [
    {"speaker": "advisor", "text": "Patricia, you've retired. How does it feel?"},
    {"speaker": "client",  "text": "Strange. I walked out of the library on June twenty-eighth and drove home and had coffee on the deck and thought: who am I now? Professionally, I mean. Thirty-one years as a research librarian and now I'm just — available. I know everyone says it takes time. It still feels strange."},
    {"speaker": "client",  "text": "She looks more rested than I've seen her in fifteen years. Whatever strange feels like, I think it looks good on her."},
    {"speaker": "advisor", "text": "Patricia, that disorientation is universal and it passes. What I want to do today is make sure the financial picture is correct now that the income picture has changed. Let me be specific: your forty-five thousand per year has stopped. The spending need is still one hundred thirty thousand per year. The income gap from the portfolio just increased by forty-five thousand."},
    {"speaker": "client",  "text": "Yes. We calculated that this morning over breakfast. We're now drawing one hundred twenty-six thousand from the portfolio instead of eighty-one thousand. That's a meaningful change."},
    {"speaker": "advisor", "text": "It's meaningful but manageable. At three point two million — the portfolio has grown from our onboarding meeting — a one hundred twenty-six thousand withdrawal is a three point nine percent rate. Still within sustainable range. But we have two developments that are about to improve this picture significantly."},
    {"speaker": "client",  "text": "What are the two developments?"},
    {"speaker": "advisor", "text": "Development one: Patricia turns sixty-five in August 2025 — thirteen months from now. Medicare Part A and B enrollment removes your ACA premium obligation, which is the most immediate expense problem. We need to find you bridge coverage for thirteen months. Development two: Patricia, when you claim Social Security — you said at sixty-seven, which is two years and two months from now — your benefit is eighteen hundred fifty per month. That adds twenty-two thousand two hundred per year to household income. The withdrawal rate drops back to three point two percent at that point."},
    {"speaker": "client",  "text": "Thirteen months on the ACA marketplace. What does that cost?"},
    {"speaker": "advisor", "text": "At your income level in retirement — primarily portfolio withdrawals — your ACA marketplace income for subsidy calculation is approximately sixty thousand from the portfolio. At sixty thousand, a silver plan for Patricia in San Diego County is approximately four hundred fifty to six hundred dollars per month. That's roughly six thousand per year for excellent coverage during the bridge period."},
    {"speaker": "client",  "text": "Six thousand per year beats the roughly fourteen thousand we were paying through my employer plan. I didn't realize retiring could reduce my healthcare cost."},
    {"speaker": "advisor", "text": "ACA subsidy income cliff management is one of the most underappreciated retirement planning tools. By controlling how much income you recognize from portfolio withdrawals, you can qualify for meaningful subsidies on the marketplace — something you could never access while working at full income."},
    {"speaker": "client",  "text": "I want to do something in retirement. I'm not a person who sits still. I've started mentoring graduate students in library science informally through my former university. George has been encouraging me to consider part-time consulting for academic libraries — analysis, collection development, that kind of work."},
    {"speaker": "advisor", "text": "Patricia, if you do part-time consulting and earn twenty-five to forty thousand, I'd be thoughtful about how that income interacts with your ACA subsidy. Earned income above a certain threshold reduces your subsidy — we'd want to model the tradeoff. But consulting income that replaces portfolio withdrawals is generally financially beneficial. Let's revisit that when you have a clearer picture of what the consulting work looks like."},
    {"speaker": "client",  "text": "I'm not looking to finance retirement with consulting. I'm looking to stay intellectually alive. If it generates forty thousand, wonderful. If it's fifteen thousand, also wonderful."},
    {"speaker": "advisor", "text": "That's the healthiest framing I've heard in this office in a while. Work because it gives you purpose, not because you need it to work. The financial plan stands on its own. The work, if it comes, is a bonus."},
]

# ---------------------------------------------------------------------------
# MEETING 4  —  La Jolla Condo Sale Decision
# Date: February 2025 (~13 months after onboarding)
# Meeting type: planning
# Context: The Sullivans have owned a two-bedroom condo in La Jolla for
#   22 years — originally a primary residence for 12 years, then rented for
#   10. They now want to sell. Market has been strong. A realtor suggested
#   an asking price of $975K ($950K realistic closing), and the mortgage
#   balance is $178K. After transaction costs (~$60K), tax exposure needs
#   analysis — they lived there 12/22 years, so the Section 121 exclusion
#   is partial. About $740K in usable proceeds. What to do with them?
# ---------------------------------------------------------------------------
SULLIVAN_M4_CONDO_SALE = [
    {"speaker": "advisor", "text": "The condo is going on the market. Tell me where you are."},
    {"speaker": "client",  "text": "The realtor says asking price at nine hundred seventy-five, realistic close at around nine hundred fifty. We've owned it twenty-two years. We lived in it for the first twelve years before we moved to the current house when the girls were in high school. We've been renting it since 2013."},
    {"speaker": "advisor", "text": "The primary residence gain exclusion — Section 121 — requires two of the last five years of use as your primary residence. You moved out in 2013. You haven't lived there in eleven years. You don't qualify for the full two hundred fifty thousand per spouse five hundred thousand total exclusion. However, you qualify for a partial exclusion based on the portion of time you lived there."},
    {"speaker": "client",  "text": "Patricia's sister's accountant — who I don't know and have now met once — told us we'd owe nothing. I suspected that was wrong."},
    {"speaker": "advisor", "text": "His analysis may have been incorrect. Here's the rough calculation: you owned it for twenty-two years. You lived in it twelve of those years. The partial exclusion fraction is twelve over twenty-two — fifty-four and a half percent — applied to the maximum five hundred thousand exclusion gives you an exclusion of approximately two hundred seventy-two thousand. Your gain on a nine hundred fifty thousand sale with a basis of approximately eighty-five thousand — that's your original purchase including improvements — is approximately eight hundred sixty-five thousand. After the partial exclusion, your taxable gain is approximately five hundred ninety-three thousand."},
    {"speaker": "client",  "text": "Five hundred ninety-three thousand in taxable capital gain. What does that cost us?"},
    {"speaker": "advisor", "text": "Long-term capital gains — which is correct since you held it over twenty-two years — are taxable at federal rates of fifteen to twenty percent plus California state tax at thirteen point three percent for gains of this size. Rough combined effective rate of approximately twenty-eight to thirty percent. Tax bill: one hundred sixty-six to one hundred seventy-eight thousand."},
    {"speaker": "client",  "text": "So from nine hundred fifty thousand gross, after one hundred seventy-eight thousand mortgage payoff, sixty thousand closing costs, and one hundred seventy thousand in taxes, we net approximately five hundred forty-two thousand."},
    {"speaker": "advisor", "text": "That's broadly right — I'd want your CPA's exact basis analysis before finalizing the tax number. The net proceeds land in the five hundred to five hundred sixty thousand range depending on the final basis calculation and timing of the sale within the tax year."},
    {"speaker": "client",  "text": "We've been talking about downsizing here in San Diego — moving from our three thousand square foot house to something smaller. If we sell the condo and also sell the house, the total capital freed from real estate is meaningful."},
    {"speaker": "advisor", "text": "Let's separate the two decisions. If you sell the condo now and invest the proceeds, the five hundred forty thousand drops into the portfolio — bringing the total to approximately three point seven million, which improves the withdrawal rate and creates a larger buffer. Separately, if you later sell the house and use the full Section 121 exclusion — you've lived there eleven years, qualify for the full five hundred thousand exclusion — you could potentially net nine hundred thousand or more tax-free depending on price and improvements. That's your ace card for the housing question."},
    {"speaker": "client",  "text": "We don't need to decide the housing question today. Let's focus on the condo. If the five hundred forty thousand goes into the portfolio, how does it change the projections?"},
    {"speaker": "advisor", "text": "Current portfolio three point two million. Post-condo proceeds: three point seven. At your withdrawal rate, this extends the portfolio's sustainability by four to five years. You now project full wealth sustainability well past age ninety for both of you under normal return assumptions. The margin gets substantially more comfortable."},
    {"speaker": "client",  "text": "I'd like to earmark some of the proceeds for the grandchildren. Our daughter Sarah has two children — twins, age seven. We've wanted to contribute to their college funds for years but it felt irresponsible given our own situation."},
    {"speaker": "advisor", "text": "With three point seven million and the current withdrawal picture, there is no reason to delay. Fifty thousand each into 529 accounts for the twins — one hundred thousand total — would be a completely appropriate use of these proceeds. At their age with eleven years to college, that hundred thousand grows to nearly two hundred twenty thousand at seven percent. Those kids are substantially funded for college."},
    {"speaker": "client",  "text": "We'd like to do that. That would be meaningful to both of us."},
    {"speaker": "advisor", "text": "Put it in motion. File the listing on the condo, get the CPA started on the basis analysis, and we'll open the grandchildren's 529s as soon as you have a buyer under contract."},
]

# ---------------------------------------------------------------------------
# MEETING 5  —  Annual Review / First Full Retired Year
# Date: June 2025 (~17 months after onboarding)
# Meeting type: annual_review
# Context: The first full year with both George and Patricia retired. Condo
#   sold February (net proceeds ~$541K). Portfolio is now $3.73M. 50/50
#   allocation working. Spending came in at $142K — slightly over the $130K
#   plan. George turns 69 this year; Patricia 65, now on Medicare. Patricia
#   started part-time consulting at a university library system (~$22K/year).
#   George's SS is going strong. Patricia's SS claim is 2.5 years out.
# ---------------------------------------------------------------------------
SULLIVAN_M5_ANNUAL_REVIEW = [
    {"speaker": "advisor", "text": "Full year in retirement for both of you. Let's see how the reality compared to the projection."},
    {"speaker": "client",  "text": "I'll start with what I know isn't great. We spent more than we planned. I'm going to say the number before you see it: one hundred forty-two thousand."},
    {"speaker": "advisor", "text": "Tell me what drove the overage."},
    {"speaker": "client",  "text": "Travel. We went to Portugal in March for three weeks. We went to see our daughter in Colorado twice. We had the appliance replacement in the kitchen — that was eight thousand we didn't plan. And Patricia's consulting has added structure to the weeks but also added lunches with colleagues and small expenditures I didn't anticipate."},
    {"speaker": "client",  "text": "I also started a garden that turned out to be more expensive than I expected. I am somewhat embarrassed to report that I have spent over two thousand dollars on raised bed infrastructure and heirloom seeds."},
    {"speaker": "advisor", "text": "Patricia, the garden is an excellent use of money. Here's the real question: does one hundred forty-two thousand represent normal spending or expansion spending? Travel is often front-loaded in early retirement — the 'go-go years' — and tends to moderate naturally as the pace calms."},
    {"speaker": "client",  "text": "I expect next year to be closer to one hundred twenty-five to one hundred thirty. We got some travel out of our system. The Portugal trip was a dream trip we'd been delaying for ten years."},
    {"speaker": "advisor", "text": "Good framing. At one hundred forty-two thousand withdraw from a three point seven three million portfolio, your withdrawal rate is three point eight percent — still within sustainable range. More importantly, Patricia's consulting income of twenty-two thousand reduced the portfolio draw by that same amount. Without her consulting, the draw would have been one hundred sixty-four thousand. She more than offset the overage."},
    {"speaker": "client",  "text": "I didn't think about my consulting that way — as reducing portfolio withdrawal rather than just being extra money. That reframe is helpful. I've been inclined to think the consulting doesn't matter financially because it's part-time. It clearly does matter."},
    {"speaker": "advisor", "text": "Every dollar of earned income in early retirement is worth approximately twenty-five dollars of portfolio capital at a four percent withdrawal rate. Your twenty-two thousand in consulting is equivalent to five hundred fifty thousand dollars in portfolio value in terms of the draw it offsets. That is not insignificant consulting."},
    {"speaker": "client",  "text": "I become a much more enthusiastic consultant when I think about it that way."},
    {"speaker": "advisor", "text": "George — you turn sixty-nine this year. In four years you'll face required minimum distributions from the IRA. Do you want to run a Roth conversion strategy before seventy-three to reduce the RMD burden?"},
    {"speaker": "client",  "text": "What would that involve?"},
    {"speaker": "advisor", "text": "Converting a portion of the traditional IRA to Roth each year — up to the top of the twenty-two percent bracket — reduces the pre-tax balance subject to RMDs. For you, at current balances, the RMDs at seventy-three could push you into a higher bracket and potentially trigger Medicare IRMAA surcharges. Systematic Roth conversions between now and seventy-three reduce that risk."},
    {"speaker": "client",  "text": "How much conversion per year?"},
    {"speaker": "advisor", "text": "The twenty-two percent bracket top for married filing jointly is approximately one hundred ninety-three thousand. Your current income is George's SS of thirty-one thousand, Patricia's consulting of twenty-two thousand — fifty-three thousand total. You can convert up to one hundred forty thousand per year before hitting the twenty-four percent bracket. That's aggressive but very efficient."},
    {"speaker": "client",  "text": "Let's plan to convert ninety to one hundred thousand per year for the next four years. That's manageable and materially reduces the future RMD exposure."},
    {"speaker": "advisor", "text": "Agreed. I'll model the optimal conversion schedule for your CPA before year-end. Now — the grandchildren's 529s. You funded them in March from the condo proceeds. Both are at fifty-three thousand after four months of growth. How are the girls feeling about that?"},
    {"speaker": "client",  "text": "Our daughter cried when we told her. She never expected it. She said she and her husband had been lying awake worrying about college costs. The twins are seven — she has eleven years of worrying she doesn't have to do any more."},
    {"speaker": "advisor", "text": "That is the most meaningful sentence I've heard in this office in months. The portfolio is performing well. The plan is working. And the people you love are sleeping better. That's what the work is for."},
]

# ---------------------------------------------------------------------------
# MEETING 6  —  Long-Term Care Conversation
# Date: January 2026 (~24 months after onboarding)
# Meeting type: planning
# Context: Patricia's mother, Eleanor (87), was admitted to assisted living
#   in November 2025. The monthly cost is $8,500. Her long-term care
#   insurance only covers $3,000/month. She has insufficient savings for
#   more than 2-3 years. Patricia and George are facing the prospect of
#   supplementing her care costs — and simultaneously confronting their own
#   vulnerability to similar situations. George is 69; Patricia is 65.
#   This is the most emotionally weighted meeting of the relationship.
# ---------------------------------------------------------------------------
SULLIVAN_M6_LTC_DISCUSSION = [
    {"speaker": "advisor", "text": "Patricia — how is your mother doing?"},
    {"speaker": "client",  "text": "She moved into assisted living in November. The facility is lovely — she seems settled and the staff is kind. But the financial reality is difficult. Her long-term care insurance — which she bought in 1998 — pays three thousand per month. The actual cost is eight thousand five hundred. The gap is five thousand five hundred per month."},
    {"speaker": "advisor", "text": "Sixty-six thousand per year gap above her insurance coverage. Does she have savings to cover that?"},
    {"speaker": "client",  "text": "She has approximately two hundred thousand in CDs and a small brokerage account. At sixty-six thousand per year gap, that's three years. She's eighty-seven. If she lives to ninety-two — a reasonable scenario — we have a two-year funding gap after her savings are exhausted."},
    {"speaker": "advisor", "text": "Is Medicaid an eventual option for her?"},
    {"speaker": "client",  "text": "Potentially, but her facility doesn't accept Medicaid — and we don't want to move her. If she transitions to Medicaid she'd need to change facilities and we're not willing to do that. We've decided as a family that we will cover the gap if necessary."},
    {"speaker": "advisor", "text": "At five thousand five hundred per month, the most the two years would cost is one hundred thirty-two thousand — if the timing is exactly as projected. At your portfolio level that's meaningful but entirely manageable. I want to make sure you're both emotionally prepared for that financial commitment, but it won't destabilize your plan."},
    {"speaker": "client",  "text": "We've decided. That's not the question that kept me awake last month. The question is us. George is sixty-nine. I'm sixty-five. My mother needed this at eighty-seven. Her long-term care policy was bought twenty-eight years ago and covers less than forty percent of actual costs because her benefits haven't kept pace with inflation. We cannot make the same mistake."},
    {"speaker": "advisor", "text": "I want to be direct with you about long-term care insurance. The private LTC insurance market has contracted significantly. Many carriers have exited. Premiums have increased thirty to forty percent over the past decade on existing policies — which is what happened to your mother's policy. Getting quotes over sixty-five is harder and more expensive. What's your health status, both of you?"},
    {"speaker": "client",  "text": "Patricia had a borderline cholesterol level corrected by statins — no other concerns. I have well-managed hypertension. We'd both likely qualify for standard rates."},
    {"speaker": "advisor", "text": "There are two approaches for people in your situation with a strong portfolio. First: traditional long-term care insurance — an annual premium in the range of four thousand to seven thousand each for a policy paying six thousand to eight thousand per month with five percent annual benefit increases and a three-year benefit period. This protects the portfolio from a catastrophic multi-year care event for either of you."},
    {"speaker": "client",  "text": "What's the second approach?"},
    {"speaker": "advisor", "text": "Self-insurance through the portfolio. At three point seven million, you could set aside five hundred thousand in a separately managed 'long-term care reserve' invested conservatively. This reserve is earmarked for care costs and remains part of your estate if not used. No premiums. Full control. The risk: if both of you need multi-year memory care simultaneously, five hundred thousand may be insufficient."},
    {"speaker": "client",  "text": "What does memory care cost today for both of us simultaneously?"},
    {"speaker": "advisor", "text": "Memory care at a quality facility in San Diego: approximately ten to twelve thousand per month per person. Both of you simultaneously: twenty to twenty-four thousand per month or two hundred forty to two hundred eighty-eight thousand per year. Five hundred thousand in a reserve lasts less than two years at that rate. That is the gap insurance exists to fill."},
    {"speaker": "client",  "text": "We watched my mother's situation. We know what unplanned care costs look like. I want insurance. I don't want our daughters to go through what we're experiencing right now with Eleanor."},
    {"speaker": "client",  "text": "George, I want insurance too. This year. Before we get any older and it becomes harder to qualify."},
    {"speaker": "advisor", "text": "Then let's move quickly. I'll get quotes from the three remaining quality carriers — Mutual of Omaha, Nationwide, and Transamerica — for both of you simultaneously. I want policies with inflation protection of at least three percent compounded, a three-year minimum benefit period, and a ninety-day elimination period to keep premiums manageable. When the quotes come back, we'll compare them against the self-insurance scenario with current portfolio projections. You'll have a fully informed decision within three to four weeks."},
    {"speaker": "client",  "text": "Thank you. And thank you for the year. Two years ago we walked in with a portfolio that felt like a ticking clock — too risky and unstructured. Now we have an income ladder, a rebalanced portfolio, the condo proceeds invested, the grandchildren funded, and we're having the conversation about protecting what we've built. We feel like we're actually managing our retirement, not just hoping it works out."},
    {"speaker": "advisor", "text": "That shift from hope to design — that's what this work is supposed to produce. You've done everything right in the last two years. The protection conversation is the last piece of the foundation. Let's complete it."},
]
