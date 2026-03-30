"""
Marcus Williams — Multi-Meeting Journey (Meetings 2 through 6)

Building on the initial prospecting meeting (MARCUS_WILLIAMS in profiles.py),
this module captures Marcus's evolving relationship with his advisor as a
post-exit entrepreneur navigating new wealth and the irresistible pull to
build again:

  M2  Onboarding / Deployment Strategy      Jan 2024  — 6 weeks after M1
  M3  Acquirer Stock Crisis                  Nov 2024  — stock down 40%, lockup ending
  M4  The Itch: New Venture Decision         Apr 2025  — co-founding an AI company
  M5  Annual Review                          Jun 2025  — DAF distributions, kids college
  M6  Secondary Sale Offer                   Jan 2026  — PE firm bids on acquirer shares

Key themes:
  - Entrepreneur psychology: wealth doesn't cure the need to build
  - Concentration risk keeps finding Marcus, even after diversification
  - Charitable giving evolving from tax strategy to genuine mission
  - Family security vs. risk appetite — Elena's perspective matters
  - The discipline of staying patient when you're wired for action
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# MEETING 2  —  Onboarding / Capital Deployment Strategy
# Date: mid-January 2024 (~6 weeks after M1)
# Meeting type: onboarding
# Context: The sale closed in late November 2023. Marcus has $2.8M cash
#   sitting in his business checking, $400K brokerage, $320K 401k, and
#   $1.4M in acquirer equity with a two-year lockup. The tax filing is
#   in April and the 2023 capital gains are coming due. Advisor presents
#   the deployment plan, DAF structuring, and acquirer equity strategy.
#   Elena joins for the first time. Sentiment: urgent, decisive, grounded.
# ---------------------------------------------------------------------------
WILLIAMS_M2_ONBOARDING = [
    {"speaker": "advisor", "text": "Marcus, Elena — good to have you both today. Elena, Marcus has spoken about wanting you to be part of these conversations and I'm glad you're here. This is your financial life together."},
    {"speaker": "client",  "text": "Elena has been the one keeping me from doing anything reckless with this money since the close. She's been the sensible guardrails."},
    {"speaker": "client",  "text": "I've been telling him that sitting in a business checking account for six weeks is not a financial strategy. It was fine to pause and think but we need to act."},
    {"speaker": "advisor", "text": "You're both right — the waiting was appropriate, the time to move is now. Let me walk through the full picture. Marcus, your estimated 2023 federal and Texas capital gains tax liability on the sale is approximately four hundred twenty thousand dollars. That is going to be the single biggest check you've ever written. It's due in April. Is the cash still in the business account?"},
    {"speaker": "client",  "text": "Yes, two million eight hundred thousand. Haven't touched it except for a small distribution to pay some personal expenses."},
    {"speaker": "advisor", "text": "Good. First move: set aside five hundred thousand in a high-yield savings account immediately — that is your tax reserve. Non-negotiable. That covers the April payment and the Q1 estimated tax for 2024."},
    {"speaker": "client",  "text": "Done. I'll transfer that today. What happens to the remaining two point three million?"},
    {"speaker": "advisor", "text": "Here's the deployment plan. Five hundred thousand into the Donor-Advised Fund — funded with appreciated acquirer shares, not cash, to avoid triggering additional capital gains. This gives you the full five hundred thousand deduction against 2023 income and you don't pay capital gains on the appreciated shares. This is the most tax-efficient move in the entire plan."},
    {"speaker": "client",  "text": "I want to make sure the DAF has enough in it to actually do meaningful giving over the next five to ten years. Five hundred thousand feels right."},
    {"speaker": "client",  "text": "His church gets the first distribution. That was always Marcus's condition."},
    {"speaker": "advisor", "text": "Absolutely. And you can distribute from the DAF at any time, to any qualified public charity. The money grows tax-free inside the DAF until you grant it out — so time is your friend. Once the DAF is funded through appreciated shares, we deploy the remaining two point three million in cash in four tranches over twelve months. This is not lump-sum deployment — the goal is disciplined dollar-cost averaging into the target allocation while we watch the macro environment."},
    {"speaker": "client",  "text": "Target allocation for the two point three million?"},
    {"speaker": "advisor", "text": "Based on your moderate-aggressive profile: fifty percent diversified global equities — broad index funds, some international, small tilt to quality factor — thirty percent fixed income split between investment-grade corporates and inflation-linked bonds, ten percent real estate investment trusts, and ten percent liquid alternative strategies. No individual stock positions except what we've inherited from the sale transaction."},
    {"speaker": "client",  "text": "I don't want to end up with another single-company concentration. The entire reason I left the business was because all of my eggs were in one basket. I don't want that again."},
    {"speaker": "advisor", "text": "That discipline will be harder to hold than you think — and I want you to hear that now, when you're clear-headed. Because within eighteen months, there will be an opportunity that looks completely rational to concentrate again. I'm flagging it in advance so we have this conversation on the record."},
    {"speaker": "client",  "text": "That's either very wise or very specific. Which is it?"},
    {"speaker": "advisor", "text": "A little of both. The acquirer equity — one point four million, two-year lockup — is already your second single-company concentration. By the time December 2025 arrives and the lockup expires, that position will have grown or declined significantly in value. I want us to have a pre-committed plan: when the lockup expires, we sell a minimum of fifty percent of the acquirer position in the first thirty days."},
    {"speaker": "client",  "text": "Pre-committed. I like that. Because you're right — by then it'll feel like I'm selling at exactly the wrong time or the right time and either way I won't be objective."},
    {"speaker": "advisor", "text": "The plan eliminates the emotion from the decision. On estate planning — Marcus, you mentioned wanting to move assets out of the estate. Before this appreciation runs further, I want to get the estate attorney working on a Spousal Lifetime Access Trust. You can move a significant portion of the assets into the trust, remove them from your taxable estate, and Elena still has access during her lifetime. With your net worth approaching five million, this starts to matter from an estate tax perspective."},
    {"speaker": "client",  "text": "I talked to Elena about this after our last meeting. We're both comfortable moving aggressively on estate planning. The kids are fourteen and eleven — we want a structure that protects them regardless of what happens to us."},
    {"speaker": "client",  "text": "And college — Sofia and Diego. That needs to be funded. We never started 529 plans."},
    {"speaker": "advisor", "text": "Open two 529 accounts this week. I recommend one hundred thousand in Sofia's and eighty thousand in Diego's as initial contributions — you are well within the five-year gift tax election rules which let you superfund up to ninety thousand per individual without triggering gift tax. Combined, that is one hundred eighty thousand off your taxable estate immediately, growing tax-free for college."},
    {"speaker": "client",  "text": "Let's do one hundred thousand each. Make it clean and equal. I don't want either of them thinking there was a difference."},
    {"speaker": "advisor", "text": "Done. I'll send the 529 paperwork along with the DAF account opening documents today. Marcus, Elena — you came in with a tax emergency and a lot of cash. You're walking out today with a plan that addresses the taxes, protects the assets, funds your kids' education, expresses your charitable values, and builds wealth for your family's future. That is a good day's work."},
]

# ---------------------------------------------------------------------------
# MEETING 3  —  Acquirer Stock Crisis  (client-initiated, urgent)
# Date: November 2024 (~10 months after onboarding)
# Meeting type: portfolio_review
# Context: The acquiring company's stock has declined 40% amid earnings
#   disappointments and a sector rotation away from legacy software. Marcus's
#   original $1.4M position (at deal price) is now worth approximately $840K.
#   The two-year lockup expires December 15, 2024 — six weeks away.
#   Marcus calls asking whether to sell on day one or wait.
#   Sentiment: Marcus is controlled but tense; echoes of his entrepreneur
#   instinct to "do something" are pulling against the pre-committed plan.
# ---------------------------------------------------------------------------
WILLIAMS_M3_ACQUIRER_CRISIS = [
    {"speaker": "advisor", "text": "Marcus — thanks for coming in. I know you've been watching the acquirer's stock closely. Let's look at this together. You called this a crisis. Tell me what you're seeing."},
    {"speaker": "client",  "text": "The stock is down forty percent from where it was when I received the shares at close. The one point four million I was counting on is now eight hundred forty thousand. And the lockup expires December fifteenth — six weeks. I can't decide whether to sell everything on December 15th or wait and see if it recovers."},
    {"speaker": "advisor", "text": "Before we talk about what to do on December 15th, I want to remind you of what we said in January. In our onboarding meeting, you said — and I wrote it down — that by the time the lockup expired, it would feel like the exactly wrong time or the right time to sell, and you wouldn't be objective. We pre-committed to selling a minimum of fifty percent in the first thirty days. Do you still agree with that logic?"},
    {"speaker": "client",  "text": "When I hear you recite that back to me — yes, analytically I agree. Emotionally, the stock is down forty percent and selling now feels like locking in the loss. That's the part my brain is fighting."},
    {"speaker": "advisor", "text": "That emotional reaction is loss aversion, and it's completely human. But let's run the actual math. If you hold the position after December 15th, you're making a concentrated bet on a single software company recovering its forty percent decline. What is your edge in making that bet? You no longer work there. You have no inside information. You don't know the next three earnings reports."},
    {"speaker": "client",  "text": "I don't have any edge. I know the acquirer's general business but not their internal road map. You're right."},
    {"speaker": "advisor", "text": "Compare that to the known outcome of diversifying the eight hundred forty thousand. Redeployed into your target allocation at the same risk level, that capital participates in market upside broadly without the single-company downside risk. The expected value of diversification is nearly always higher than holding concentration when you have no informational edge."},
    {"speaker": "client",  "text": "The forty percent loss — is there a tax implication to selling on December 15th versus waiting until after January 1st?"},
    {"speaker": "advisor", "text": "Excellent question. The shares were received as part of a deal — there are tax law details about holding period and character of gain that your CPA needs to confirm. But here is what I know: the shares you received at deal close have a cost basis equal to the fair market value at issuance. The decline since then is a capital loss. If you sell in 2024, you offset some of your 2024 capital gains. If you sell in January 2025, it flows into 2025. Your CPA should advise on which year is better for overall tax positioning. I'll coordinate with him this week."},
    {"speaker": "client",  "text": "The 2025 tax year might actually be better because I'll have less other income to offset. My earned income this year is essentially zero and next year is also very low."},
    {"speaker": "advisor", "text": "That's a strong argument for the January sale. Which also happens to keep us aligned with the pre-committed plan: sell in the first thirty days after the lockup — meaning before January 15th. January 5th or 6th would be my target date, assuming no material non-public information concerns."},
    {"speaker": "client",  "text": "Do fifty percent or one hundred percent?"},
    {"speaker": "advisor", "text": "Given the forty percent decline, the remaining concentration, and the fact that you have no information edge — I'm recommending one hundred percent. The original plan was fifty percent minimum. The current facts support the maximum. You walked away from this acquisition to diversify your risk. This is the moment you actually do it."},
    {"speaker": "client",  "text": "I came in here hoping you'd give me permission to wait. Instead you've given me permission to sell. I know which one is right."},
    {"speaker": "advisor", "text": "Your instinct is right. One more thing before we close. Your total managed portfolio today — the two point three million we deployed plus your original four hundred thousand brokerage — is at two point eight million, up from two point seven at deployment start despite the acquirer decline. The diversified allocation is working. Adding the eight hundred forty thousand from the acquirer sale in January brings you to three point six million in diversified assets. That is the outcome of following the plan."},
    {"speaker": "client",  "text": "Three point six million diversified. No concentration. No lockup. This is what financial independence actually looks like. Okay. January sale. You have my word."},
    {"speaker": "advisor", "text": "I'll coordinate with your CPA this week, prepare a limit order strategy for January 5th, and we'll execute together. Marcus — this is the hard part of wealth management. Selling at the right time emotionally feels like the wrong time. That tension is a feature, not a bug."},
]

# ---------------------------------------------------------------------------
# MEETING 4  —  The Itch: New Venture Decision
# Date: April 2025 (~15 months after onboarding)
# Meeting type: planning
# Context: Marcus has been approached by former colleagues to co-found an
#   AI infrastructure company. He would contribute $500K in capital and
#   take equity in exchange. He's genuinely excited — this is what he does.
#   But Elena has concerns. This is the first meeting with real marital
#   financial tension. Advisor serves as honest mediator.
#   Sentiment: Marcus is lit up; Elena is thoughtful and cautious.
# ---------------------------------------------------------------------------
WILLIAMS_M4_NEW_VENTURE = [
    {"speaker": "advisor", "text": "Marcus, Elena — you asked to meet urgently and you said it was quote 'complicated.' I cleared the morning. Tell me what's happening."},
    {"speaker": "client",  "text": "I've been approached by two of the best engineers I know to co-found an AI infrastructure company. The space is exactly right, the timing is right, the team is right. I would invest five hundred thousand in capital as a founding partner and receive twenty-two percent equity. I want to do it."},
    {"speaker": "client",  "text": "And I have questions about whether this is the right financial decision for our family. That's why we're both here instead of Marcus just doing it."},
    {"speaker": "advisor", "text": "Elena, I appreciate you both being here. This is exactly the kind of decision that shouldn't be made unilaterally. Marcus — walk me through the opportunity. What's the team's track record, what problem are they solving, and what's the realistic valuation in five years?"},
    {"speaker": "client",  "text": "The lead technical founder built the infrastructure stack at a major cloud provider for six years. The other co-founder sold a developer tools company for eighty million in 2022. The problem is real-time inference optimization — making AI models run fifty to eighty percent cheaper at scale. Every company deploying models has this problem. Series A is probable within eighteen months at a pre-money valuation I'd be getting in at one tenth of."},
    {"speaker": "advisor", "text": "That is a compelling opportunity by any venture standard. Now the financial question: five hundred thousand from where? And what does that do to your overall portfolio?"},
    {"speaker": "client",  "text": "From the diversified portfolio. Which puts a six-inch hole in the allocation we just built and then immediately refilled from the acquirer sale in January."},
    {"speaker": "advisor", "text": "Let me show you the math. Your current total invested portfolio is three point six million. Five hundred thousand represents thirteen point nine percent of your investable assets. That is material. The question isn't whether the company might succeed — it might, and the upside is real. The question is whether your family can absorb a zero on this position without materially damaging your financial security."},
    {"speaker": "client",  "text": "A zero on five hundred thousand against three point six million is a fourteen percent permanent impairment."},
    {"speaker": "advisor", "text": "At current spending of one hundred twenty thousand per year and your growth rate in the portfolio, a fourteen percent permanent impairment extends your projected wealth runway by about four years and reduces the estate you ultimately pass to Sofia and Diego by approximately two point two million at today's growth rates. Marcus, I am not telling you not to do this. I'm making sure you're choosing with full information."},
    {"speaker": "client",  "text": "I want to hear Elena's actual concern, not just the polite version."},
    {"speaker": "client",  "text": "My concern is that Marcus is a builder. He was miserable for the first eight months after the sale. He's happy again for the first time since close. But five hundred thousand is a lot to put into a company that might fail. And if it fails, I'm afraid of what it does to him emotionally, not just financially."},
    {"speaker": "advisor", "text": "Elena, that is a very insightful frame. Marcus — is she right about the emotional dimension?"},
    {"speaker": "client",  "text": "She's right. I need to build things. I was genuinely unhappy just being an investor. But I hear what you're both saying about the amount."},
    {"speaker": "advisor", "text": "Here's what I'd like to propose as a middle path. Rather than five hundred thousand, structure this as two hundred fifty thousand at founding, with a right to put in an additional two hundred fifty thousand at any point in the next twenty-four months based on company progress. You get the full founding equity at the lower entry price, you limit initial family exposure to six point nine percent of the portfolio, and you retain the capital for further investment only if the early milestones validate the thesis."},
    {"speaker": "client",  "text": "Two hundred fifty now, two fifty option later. The founders will accept that — I negotiated the equity already. If I present it as staged capital, I don't think they'll push back."},
    {"speaker": "client",  "text": "Two hundred fifty thousand is something I can make peace with. Full five hundred thousand at once is what made me nervous. That is a reasonable compromise."},
    {"speaker": "advisor", "text": "From an estate planning perspective, this investment actually creates an interesting opportunity. The two hundred fifty thousand founder's equity carries a very low fair market value right now — pre-revenue, pre-product. If Marcus contributes this to an Irrevocable Trust today, the gift tax value is negligible. If the company succeeds, all the appreciation happens inside the trust and out of the taxable estate. Your estate attorney can structure this properly within weeks."},
    {"speaker": "client",  "text": "So if the company is worth fifty million in five years, my proportional share stays in the trust, not in my taxable estate?"},
    {"speaker": "advisor", "text": "Exactly. You pay gift tax on the tiny current valuation. All the upside accrues outside your estate. It's one of the most powerful estate planning moves available to founders at the pre-revenue stage. I'd move quickly — once the company has any funding at a higher valuation, the gift tax cost goes up substantially."},
    {"speaker": "client",  "text": "This gets better the more I understand it. Marcus, I support this. Two hundred fifty thousand, staged capital, trust structure. That is a yes from me."},
    {"speaker": "client",  "text": "You navigated this better than I did. Thank you, Elena."},
    {"speaker": "advisor", "text": "You came in as a complicated conversation and you're leaving with a structured, tax-efficient entrepreneurial investment that keeps your family financially safe. That is good planning. Let's schedule a call next week with the estate attorney to start the trust structure."},
]

# ---------------------------------------------------------------------------
# MEETING 5  —  Annual Review  (18 months in, new venture 3 months old)
# Date: June 2025 (~17 months after onboarding)
# Meeting type: annual_review
# Context: Portfolio at $3.4M (net of $250K venture investment).  DAF has
#   grown to $540K with $75K in distributions made.  Marcus's church got
#   $50K, education nonprofits got $25K. Sofia is 15, Diego is 12.
#   New venture has closed a $2M seed round at $8M pre-money — validates
#   Marcus's entry at $250K for 22% equity. Family estate trust established.
#   Sentiment: confident, energized, increasingly charitable.
# ---------------------------------------------------------------------------
WILLIAMS_M5_ANNUAL_REVIEW = [
    {"speaker": "advisor", "text": "Marcus — this is your first formal annual review and it is a very different picture from where you sat frightened in my office with a tax emergency eighteen months ago. Let me show you the full arc."},
    {"speaker": "client",  "text": "Elena could not make it — she has the kids' end-of-year events today. I'll give her the full debrief. But yes — eighteen months ago I walked in with two point eight million in a business checking account and a four-hundred-twenty-thousand-dollar tax bill. I was terrified."},
    {"speaker": "advisor", "text": "Today your total invested portfolio — excluding the venture investment — is three point four million. That includes the January acquirer shares sale, full deployment of your capital, and net returns. Up approximately seven hundred thousand from your net starting position. Your venture investment of two hundred fifty thousand is now valued on paper — based on the seed round valuation — at approximately two hundred twenty thousand, which is roughly flat because of how equity dilution works at the seed stage. That number could be dramatically different in eighteen more months."},
    {"speaker": "client",  "text": "The seed round validation was everything. These guys raised two million from serious investors at eight million pre-money. My two hundred fifty thousand founding stake has survived the first credibility test. That's all I needed to see."},
    {"speaker": "advisor", "text": "Well positioned, and the trust structure holding your equity means all future appreciation is already outside your taxable estate. Let's look at the main portfolio performance. The diversified allocation returned eleven point four percent year over year against the benchmark at ten point one percent. Part of the outperformance came from the tilts toward quality factor equities and inflation-linked bonds during the first half of the year."},
    {"speaker": "client",  "text": "Eleven percent on three point four million is over three hundred fifty thousand dollars in one year. I have never experienced that kind of return on paper. It doesn't feel real yet."},
    {"speaker": "advisor", "text": "It becomes real when you see it compounding over years. At this rate and savings rate, your projected estate value at death at eighty-five is in the twelve to eighteen million range. That is generational wealth — the kind that funds Sofia and Diego's college, graduate school, houses, and their own families."},
    {"speaker": "client",  "text": "We need to talk about college. Sofia is fifteen. Three years away from freshman year. What do the 529s look like?"},
    {"speaker": "advisor", "text": "You put one hundred thousand into each account in January 2024. Eighteen months of growth at seven percent has taken Sofia's account to one hundred twelve thousand and Diego's to one hundred eight thousand. For four years at a high-cost private university today — call it eighty thousand per year — you need three hundred twenty thousand per child at minimum. You need to add approximately forty to fifty thousand more to each account in the next three years to be fully funded."},
    {"speaker": "client",  "text": "So we're about halfway there. I'll add thirty thousand to each account today and set up annual top-ups."},
    {"speaker": "advisor", "text": "Good. Add twenty thousand in year two and fifteen thousand in year three and Sofia is fully funded at enrollment. Now — the DAF. You've made seventy-five thousand in grants. Your church, the education nonprofits. How is the giving feeling?"},
    {"speaker": "client",  "text": "Honestly — this has been one of the most meaningful parts of the last year. Watching the church expand their community kitchen program with our gift felt different from a tax deduction. I want to double our annual giving rate."},
    {"speaker": "advisor", "text": "The DAF is at five hundred forty thousand after grants and growth. At your current rate, it generates about thirty-five thousand per year in investment growth inside the fund. If you grant out one hundred thousand per year going forward, you're essentially running a perpetual giving endowment — the fund depletes slowly but continues giving for many years. I want you to think about a giving strategy, not just an annual number."},
    {"speaker": "client",  "text": "I've been thinking about that. I want to fund computer science education in Austin public schools. There's an organization called CodeFirst that is exactly what I want to support. I'd like to give them two hundred fifty thousand over five years — fifty thousand per year — as a committed grant."},
    {"speaker": "advisor", "text": "That's a substantial commitment that a DAF can contractually support. I'll coordinate with Fidelity Charitable on setting up the five-year grant commitment. They can receive the full pledge upon your direction. Marcus — eighteen months ago you asked me to help you protect your family and do something meaningful with what you built. I think you're doing both."},
    {"speaker": "client",  "text": "Not bad for a guy who came in with his money in a business checking account and no plan."},
]

# ---------------------------------------------------------------------------
# MEETING 6  —  Secondary Sale Offer on Acquirer Equity
# Date: January 2026 (~24 months after onboarding)
# Meeting type: planning
# Context: A private equity firm has approached Marcus to purchase his
#   remaining acquirer equity (he received a second tranche that wasn't
#   covered under the original lockup — this is a small "earnout" position
#   of approximately 75K shares worth $800K at current price). They're
#   offering a 7% premium above market. Marcus wants to know whether to
#   sell, and what to do with the proceeds. New venture has launched its
#   beta product and has 12 paying customers.
# ---------------------------------------------------------------------------
WILLIAMS_M6_SECONDARY_SALE = [
    {"speaker": "advisor", "text": "Marcus — you said this was time-sensitive. Tell me about the secondary offer."},
    {"speaker": "client",  "text": "A private equity firm reached out last week through my lawyer. They want to buy my remaining earnout shares in the acquirer — it's a secondary market purchase. They're offering eight hundred thousand for the block, which is about seven percent above Friday's closing price. I have seventy-two hours to decide."},
    {"speaker": "advisor", "text": "What does this batch of shares consist of exactly, and what is your cost basis?"},
    {"speaker": "client",  "text": "These are the earnout shares — they issued when the company hit a revenue milestone in Q3. My cost basis is essentially zero since they came as performance compensation tied to the earnout clause in the acquisition agreement. The full eight hundred thousand would be ordinary income or long-term capital gain, depending on how my CPA classifies the earnout structure. He thinks long-term."},
    {"speaker": "advisor", "text": "Let's assume long-term capital gains treatment — your federal rate at your income level is twenty percent plus the net investment income tax of three point eight percent. Texas has no state income tax. So the net tax on eight hundred thousand in long-term gain is approximately one hundred eighty thousand, leaving you with six hundred twenty thousand after tax."},
    {"speaker": "client",  "text": "Six hundred twenty thousand after tax. And the alternative is to hold the shares at current market value of seven hundred forty-eight thousand, hope the stock recovers, and face the same tax when I eventually sell."},
    {"speaker": "advisor", "text": "The seven percent premium they're offering is essentially compensation for your illiquidity in a secondary market transaction. In present value terms, if you believe the stock performance will be flat to market, capturing the premium and deploying into your diversified allocation has a higher expected value than holding concentrated equity you have no information edge on."},
    {"speaker": "client",  "text": "I said that exact sentence to myself this morning. I have no edge on predicting this company's stock. I have edge on building AI infrastructure companies, which is what I'm doing next door."},
    {"speaker": "advisor", "text": "The decision is straightforward in that context: accept the secondary offer, book the gain accurately with the CPA, and in January make a strategic allocation of the six hundred twenty thousand net. I want to propose something specific with this capital rather than just folding it back into the main portfolio."},
    {"speaker": "client",  "text": "What are you thinking?"},
    {"speaker": "advisor", "text": "Three buckets. One hundred fifty thousand into the DAF as an immediate additonal contribution — you've committed fifty thousand per year to CodeFirst and this accelerates the funding while giving you the deduction against the capital gain income. Two hundred thousand into a separately managed account focused on emerging-market and small-cap equities — you're underweight these in your current allocation. And two hundred seventy thousand into a direct lending fund — private credit — that is currently yielding nine to ten percent with monthly distributions. The distributions would generate roughly twenty-three thousand per year in income that funds your giving budget and household expenses without touching the equity portfolio."},
    {"speaker": "client",  "text": "Private credit yielding nine to ten percent. That's real money coming in every month. How does that interact with the DAF contribution on the tax side?"},
    {"speaker": "advisor", "text": "The DAF contribution creates a deduction of one hundred fifty thousand. That offsets a significant portion of the gain income. Net taxable gain after the DAF deduction drops from eight hundred thousand to six hundred fifty thousand. Tax on six hundred fifty thousand at twenty-three point eight percent is approximately one hundred fifty-five thousand — fifty thousand less than without the DAF move. You've essentially funded your charitable commitment with the tax savings from making it."},
    {"speaker": "client",  "text": "This is the part of wealth management I've come to love. Every dollar is doing something specific. Nothing is sitting idle. The money is working in three directions at once."},
    {"speaker": "advisor", "text": "That's the outcome of two years of intentional planning. And the venture — twelve paying customers at beta launch is meaningful signal. What's the Series A timeline?"},
    {"speaker": "client",  "text": "We're targeting Q3 2026. The lead engineer is in conversations with two top-tier venture firms. If we close at what we expect, my two-hundred-fifty-thousand dollar entry stake would be worth approximately two million dollars on paper. Inside the trust structure, untaxed."},
    {"speaker": "advisor", "text": "If the Series A closes at target valuation, Marcus, your total net worth crosses eight million dollars within eighteen months of selling your first company. The tax-efficient charitable giving, the diversified portfolio, the staged venture investment, the trust structure protecting the upside — every piece of the plan we built is performing as intended. Accept the secondary offer. I'll coordinate with your CPA today."},
    {"speaker": "client",  "text": "You know what I came in here thinking? I thought I'd made a mess of my financial life by putting everything into the business and then panicking when the exit happened. You showed me that wasn't true. The mess was manageable. Thank you for that."},
]
