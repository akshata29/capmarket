"""
Seven realistic wealth-advisor prospect conversation scenarios.

Each scenario is a list of {"speaker": "advisor"|"client", "text": str} dicts
that can be fed directly to POST /api/meetings/{id}/inject-transcript.

Scenarios cover a wide range of:
  - Life stages (early career → retired)
  - Trigger events (business sale, divorce, inheritance, career transition)
  - Risk profiles (conservative → aggressive)
  - Asset sizes (~$600K → $4.5M)
  - Complexity (simple accumulation → estate/tax/charitable planning)

Usage:
    from tests.scenarios.profiles import SCENARIOS
    scenario = SCENARIOS["sarah_chen"]
    # POST to inject-transcript endpoint
"""
from __future__ import annotations

# ─────────────────────────────────────────────────────────────────────────────
# SCENARIO 1 — Sarah Chen, Young Tech Executive
# 35-year-old FAANG engineer.  Equity-heavy, wants diversification + early RE.
# ─────────────────────────────────────────────────────────────────────────────
SARAH_CHEN = [
    {"speaker": "advisor", "text": "Good afternoon, Sarah. Thanks for coming in today. I understand this is our first meeting — is that right?"},
    {"speaker": "client",  "text": "Yes, first time. I've been meaning to do this for a while. I'm Sarah Chen, by the way, in case you didn't have my info."},
    {"speaker": "advisor", "text": "Great to meet you, Sarah. Can I grab your contact details quickly — best email and phone number?"},
    {"speaker": "client",  "text": "Sure. Email is sarah.chen@gmail.com and my cell is 415-702-9384."},
    {"speaker": "advisor", "text": "Perfect. And how old are you currently, Sarah?"},
    {"speaker": "client",  "text": "I just turned 35 last month."},
    {"speaker": "advisor", "text": "Great. Tell me a bit about your current financial situation — where are most of your assets today?"},
    {"speaker": "client",  "text": "Most of my wealth is in company stock and vested RSUs. I work at a major tech company in San Francisco. I've accumulated about 850,000 dollars — roughly 600K in company stock and RSUs, another 150K in my 401k, and about 100K in a brokerage account."},
    {"speaker": "advisor", "text": "That's a meaningful amount. What does your annual income look like?"},
    {"speaker": "client",  "text": "Base is 280,000, plus around 300K in annual RSU vesting. So total comp is close to 580,000 this year."},
    {"speaker": "advisor", "text": "And relationship status? Any spouse or dependents we should factor in?"},
    {"speaker": "client",  "text": "Single, no kids. Just me."},
    {"speaker": "advisor", "text": "What's your primary goal for this money, Sarah?"},
    {"speaker": "client",  "text": "Honestly, I want to retire by 45 — maybe 48 at the latest. I'm not interested in working until I'm 65. I want financial independence early."},
    {"speaker": "advisor", "text": "I love that clarity. Any concerns keeping you up at night about your current setup?"},
    {"speaker": "client",  "text": "Yes, two things. First — 70% of my net worth is in one company's stock. If they have a bad year, I get hit on compensation AND portfolio at the same time. Second, I sold some RSUs last year and the tax bill was brutal. I didn't plan for it at all."},
    {"speaker": "advisor", "text": "Both very real risks. On the risk side — if your portfolio dropped 30% in a downturn, how would you react emotionally?"},
    {"speaker": "client",  "text": "I'd probably stay the course. I've seen the 2022 tech crash and held on — I think I have a pretty long stomach for volatility. I'm aggressive, but I want smarter aggressive, not just concentrated."},
    {"speaker": "advisor", "text": "That makes sense. Any other investments we should know about — real estate, crypto, angel investments?"},
    {"speaker": "client",  "text": "Small amount of Bitcoin, maybe 40K. And I did a 25K angel check for a friend's startup last year. Nothing significant beyond that."},
    {"speaker": "advisor", "text": "Last question for today — do you have a will, life insurance, or any estate planning in place?"},
    {"speaker": "client",  "text": "No will, no life insurance. I keep meaning to do it. No dependents so it felt less urgent, but I know I should."},
]

# ─────────────────────────────────────────────────────────────────────────────
# SCENARIO 2 — Robert & Linda Hayes, Pre-retirement Teachers
# Robert 58, Linda 56.  Public school teachers in WA.  7 years to retirement.
# Conservative. SS planning, pension income gap, healthcare bridge.
# ─────────────────────────────────────────────────────────────────────────────
ROBERT_LINDA_HAYES = [
    {"speaker": "advisor", "text": "Robert, Linda — welcome. It's great to finally meet you both in person. What brought you in today?"},
    {"speaker": "client",  "text": "We're both teachers in the Bellevue school district — I'm Robert Hayes, this is my wife Linda. We're about seven years out from retirement and realized we've never done proper financial planning."},
    {"speaker": "advisor", "text": "Seven years is actually a very good planning horizon. Let me start with the basics — how old are you both?"},
    {"speaker": "client",  "text": "I'm 58 and Linda is 56. We're thinking I retire first at 65, then Linda at 62 or 63."},
    {"speaker": "advisor", "text": "And your contact info — best email and phone?"},
    {"speaker": "client",  "text": "Email is robert.hayes@outlook.com. Phone is 425-881-3320. Linda doesn't use email much so just reach me."},
    {"speaker": "advisor", "text": "What does your income look like today?"},
    {"speaker": "client",  "text": "Combined we bring in about 145,000 a year. I make 82,000 and Linda makes 63,000. We also contribute the maximum to our 403b accounts."},
    {"speaker": "advisor", "text": "What have you accumulated so far in those accounts?"},
    {"speaker": "client",  "text": "Between both of our 403b accounts, we have about 680,000 total. Plus we both have the state pension — Washington PERS. My estimated pension at 65 is about 2,800 a month, Linda's would be around 1,900 once she retires."},
    {"speaker": "advisor", "text": "Do you have any other investments — taxable brokerage, real estate?"},
    {"speaker": "client",  "text": "We own our home in Kirkland — paid off, worth maybe 750,000. Small savings account, maybe 40 thousand. That's about it."},
    {"speaker": "advisor", "text": "Any debt?"},
    {"speaker": "client",  "text": "Mortgage is paid, no credit card debt. We have one car payment — 380 a month — about 14 thousand left on it."},
    {"speaker": "advisor", "text": "What are your biggest concerns going into retirement?"},
    {"speaker": "client",  "text": "Three things. One — healthcare. We retire before 65 and will lose school district coverage. We're worried about the gap before Medicare. Two — we're not sure our savings are enough to supplement the pension income. Three — we want to make sure we don't outlive the money. We've both seen parents run out."},
    {"speaker": "advisor", "text": "How would you both describe your comfort with investment risk?"},
    {"speaker": "client",  "text": "Very conservative. We don't want to lose principal. We know that limits returns but we'd rather sleep at night. Linda especially — she lost her parents' savings watching them invest aggressively."},
    {"speaker": "advisor", "text": "That's very helpful. Any estate planning — wills, powers of attorney, beneficiary designations updated?"},
    {"speaker": "client",  "text": "We have wills from 2009 — probably need to update them. No trust. Beneficiaries on the 403b accounts are each other, but we haven't checked in years."},
]

# ─────────────────────────────────────────────────────────────────────────────
# SCENARIO 3 — Marcus Williams, Entrepreneur with Business Sale
# 48.  Just sold a SaaS company for 4.2M.  Tax shock. Concentrated cash.
# Charitable giving. Estate planning. Complex.
# ─────────────────────────────────────────────────────────────────────────────
MARCUS_WILLIAMS = [
    {"speaker": "advisor", "text": "Marcus, great to finally sit down. Congratulations on the business sale — that's a huge milestone. How are you feeling?"},
    {"speaker": "client",  "text": "Honestly, a mix of relief and panic. I'm Marcus Williams. The deal closed six weeks ago. We sold for 4.2 million dollars — it was a stock-plus-cash deal so I got about 2.8 million cash at close and the rest in acquirer equity. The tax bill is terrifying."},
    {"speaker": "advisor", "text": "That's a legitimate concern — a sale like this can trigger significant capital gains. Just to set the scene, how old are you, Marcus?"},
    {"speaker": "client",  "text": "48. Kids are 14 and 11. My wife Elena doesn't work — she manages the house and the kids. We live in Austin, Texas."},
    {"speaker": "advisor", "text": "Texas — no state income tax, which helps. Email and phone, if you don't mind?"},
    {"speaker": "client",  "text": "mwilliams@protonmail.com. Cell is 512-374-6801."},
    {"speaker": "advisor", "text": "Before the sale, what was your financial picture?"},
    {"speaker": "client",  "text": "Two years ago I had about 400K in a brokerage account plus my 401k from my old corporate job — around 320K. We own our Austin home outright, bought it for 580K, probably worth 1.1 million now. I had very little liquid cash — everything was in the business."},
    {"speaker": "advisor", "text": "So with the sale proceeds, roughly what's your total picture today?"},
    {"speaker": "client",  "text": "So roughly 2.8 million in cash in my business checking — haven't moved it yet, terrified to do the wrong thing. 400K in the brokerage, 320K in the 401k, and the 1.4M in acquirer equity that has a two-year lockup. Net worth maybe 5.5 million."},
    {"speaker": "advisor", "text": "What's most urgent for you in the next six months?"},
    {"speaker": "client",  "text": "Two things. The capital gains tax — I've heard a donor-advised fund could help. My accountant mentioned something about it. Second — I am way too exposed to one asset again now that the acquirer equity is essentially replacing my old business concentration."},
    {"speaker": "advisor", "text": "The DAF is a powerful tool. Are you charitable by nature or just doing this for the tax benefit?"},
    {"speaker": "client",  "text": "Both, honestly. We give to our church and a few local education nonprofits. If I can give meaningfully AND reduce the tax hit, that feels like a win. I'd consider putting maybe 500K into a donor-advised fund."},
    {"speaker": "advisor", "text": "Let's talk risk appetite. Now that you have this capital outside a business, how do you think about investment risk?"},
    {"speaker": "client",  "text": "Moderately aggressive. I can handle a 30% drawdown on paper. I've seen it before in my brokerage. What I can NOT handle is losing the core of what I built — that 2.8 million is my family's security. So I want thoughtful risk, not reckless."},
    {"speaker": "advisor", "text": "Estate planning — any work done there?"},
    {"speaker": "client",  "text": "We have wills but nothing sophisticated. No trust, no buy-sell agreement anymore since we sold the business. I want to set up something more formal — I hear you can move assets out of the estate before they appreciate further. And I want college sorted for both kids."},
]

# ─────────────────────────────────────────────────────────────────────────────
# SCENARIO 4 — Jennifer Reyes, Divorce Settlement
# 42.  Recent divorce. $1.1M settlement. Two teenagers. Bad prior advisor.
# Moderate/cautious. College + income focus. Compliance flag.
# ─────────────────────────────────────────────────────────────────────────────
JENNIFER_REYES = [
    {"speaker": "advisor", "text": "Jennifer, welcome. I'm glad you reached out. I understand this is a time of significant change for you — take whatever time you need."},
    {"speaker": "client",  "text": "Thank you. I'm Jennifer Reyes. My divorce was finalized three months ago and I received a settlement, and I honestly have no idea what to do with it. I've never managed this much money on my own."},
    {"speaker": "advisor", "text": "Totally understandable. We'll take this at your pace. First — can I grab your contact info?"},
    {"speaker": "client",  "text": "Sure. Jennifer.reyes.pdx@gmail.com. My phone is 503-641-8820."},
    {"speaker": "advisor", "text": "And your age, if you don't mind?"},
    {"speaker": "client",  "text": "42. I have two kids — Emma is 15, and Liam is 13."},
    {"speaker": "advisor", "text": "Employment situation?"},
    {"speaker": "client",  "text": "I'm a licensed occupational therapist. I took eight years off while the kids were young and just returned to work two years ago. I'm making about 78,000 a year now at a hospital in Portland."},
    {"speaker": "advisor", "text": "What did the settlement involve, if you're comfortable sharing?"},
    {"speaker": "client",  "text": "Cash proceeds from the sale of our marital home — about 600,000. Half of my ex-husband's 401k via a QDRO — that transferred to my IRA, about 420,000. And some cash from a joint brokerage — about 80,000. So roughly 1.1 million total."},
    {"speaker": "advisor", "text": "How is that money currently positioned?"},
    {"speaker": "client",  "text": "Sitting completely in cash. I was afraid to invest without understanding what I was doing. The IRA rollover is in a money market account. I know that's not ideal."},
    {"speaker": "advisor", "text": "It's not optimal long term, but it was sensible to pause while figuring things out. What are your most pressing goals?"},
    {"speaker": "client",  "text": "College for Emma in three years and Liam in five years. That's the top priority I lay awake thinking about. We never set up 529 plans. After that, I want to build my own retirement — I got behind taking time off. And I want to buy a smaller house — something in the 450K range, I'd put 150K down."},
    {"speaker": "advisor", "text": "That's a clear roadmap. How do you feel about investment risk, Jennifer?"},
    {"speaker": "client",  "text": "Cautious but not paralyzed. I can handle some market movement, but I don't want to see this money evaporate. I'd say moderate — maybe slightly below moderate. I need to feel that this money is protected."},
    {"speaker": "advisor", "text": "You mentioned you've looked at advisors before. Any previous experience we should know about?"},
    {"speaker": "client",  "text": "Yes — we used an advisor for three years during the marriage and it was a disaster. He was churning the account, always recommending expensive products, and never explaining fees. I found out we were paying 2.1% annually in various fees. I will not work with anyone again without completely understanding the fee structure upfront."},
    {"speaker": "advisor", "text": "Completely fair. We're a fee-only fiduciary — I'll give you full transparency in writing. Any insurance or estate planning from the divorce you need to address?"},
    {"speaker": "client",  "text": "I need to redo my will from scratch, obviously. I have no life insurance — my ex had a policy but that's his now. I need to get coverage because I'm the sole provider for the kids now."},
]

# ─────────────────────────────────────────────────────────────────────────────
# SCENARIO 5 — David Huang, Inheritance Recipient
# 36.  Inherited $2.3M from grandfather.  No investment experience.
# IP Lawyer. Curious but overwhelmed. Long horizon. ESG interest.
# ─────────────────────────────────────────────────────────────────────────────
DAVID_HUANG = [
    {"speaker": "advisor", "text": "David, thanks for coming in. I understand this is actually your first time working with a financial advisor — is that right?"},
    {"speaker": "client",  "text": "Yes, first time. I'm David Huang. My grandfather passed away six months ago and left a significant amount to me and my sister. I've been frozen — I don't know what to do and I didn't want to make a mistake."},
    {"speaker": "advisor", "text": "I'm sorry for your loss. Taking measured time before acting is actually very wise. Can I grab your contact information?"},
    {"speaker": "client",  "text": "Of course. david.huang.law@gmail.com. Cell is 206-553-7290."},
    {"speaker": "advisor", "text": "And your age, career situation?"},
    {"speaker": "client",  "text": "I'm 36. I'm an intellectual property attorney here in Seattle. My base salary is 195,000. Married, my wife Amy is a software engineer — she makes about 165K. No kids yet, though we're thinking about it in the next two years."},
    {"speaker": "advisor", "text": "What's the total inheritance amount and how is it currently held?"},
    {"speaker": "client",  "text": "My share is 2.3 million. It came through about 65% in cash from the sale of grandfather's investment portfolio, plus two things that are still unsettled: a one-third interest in a commercial property in Bellevue that generates rent, and some private company stock in a medical device startup he backed. The cash portion is just sitting in a Wells Fargo savings account right now."},
    {"speaker": "advisor", "text": "And separate from the inheritance — what does your existing financial picture look like?"},
    {"speaker": "client",  "text": "Amy and I have about 180K combined in our 401ks. We rent right now — haven't bought a home. We have about 45K in a joint savings account. Student loans are fully paid off. Car loans paid off. Pretty clean balance sheet except we're renters."},
    {"speaker": "advisor", "text": "Given the inheritance, do you have a sense of what matters most to you going forward?"},
    {"speaker": "client",  "text": "A few things. First, I want to grow this thoughtfully over a long time horizon — I'm not in any rush. Second, Amy and I want to buy a house in the next 18 months — Seattle, probably around 1.2 to 1.4 million. I'd want to put down 300 thousand. Third, I care about where the money is invested. My grandfather was a renewable energy advocate and I'd like to continue that — ESG or impact investing matters to me."},
    {"speaker": "advisor", "text": "That's wonderful — and very actionable. How would you describe your risk tolerance given you've never invested before?"},
    {"speaker": "client",  "text": "Honestly, I don't know. I can reason my way to accepting market risk — I'm 36, long time horizon, stable income. But emotionally, if I checked my account and saw it down 500,000 dollars in a bear market, I'd probably feel sick. I want a thoughtful allocation, not overly aggressive."},
    {"speaker": "advisor", "text": "The commercial property and startup equity — do you want to hold them or eventually liquidate?"},
    {"speaker": "client",  "text": "The commercial property generates good cash flow — I think I'd like to hold it unless someone offers a great price. The startup equity is speculative and illiquid. I honestly don't know what to do with it — maybe wait for a liquidity event."},
    {"speaker": "advisor", "text": "Last question — estate planning. Given the inheritance, this should probably be addressed soon."},
    {"speaker": "client",  "text": "We have no estate documents at all. No wills, no healthcare directives, nothing. One of the things on my list was to get that all set up properly, especially now that there's real money involved."},
]

# ─────────────────────────────────────────────────────────────────────────────
# SCENARIO 6 — Dr. Priya Patel, Physician Career Catch-Up
# 44. Pediatrician. High income. Student loans just paid off. Behind on
# retirement. Two kids. 529s needed. Aggressive catch-up focus.
# ─────────────────────────────────────────────────────────────────────────────
DR_PRIYA_PATEL = [
    {"speaker": "advisor", "text": "Dr. Patel, great to meet you. What brought you in today?"},
    {"speaker": "client",  "text": "Hi, I'm Priya Patel. I'm a pediatrician, and I just paid off the last of my medical school loans six months ago. 185,000 over twelve years. I feel like I can finally breathe financially, and I want to make up for lost time."},
    {"speaker": "advisor", "text": "That's a huge milestone — congratulations. Can I get your contact info?"},
    {"speaker": "client",  "text": "Priya.patel.md@gmail.com. Phone is 312-488-6735."},
    {"speaker": "advisor", "text": "And how old are you, Dr. Patel?"},
    {"speaker": "client",  "text": "44. I have two kids — Rohan is ten and Ananya is eight. My husband Vikram works part time — he manages the house mostly. He brings in maybe 35,000 a year as a consultant."},
    {"speaker": "advisor", "text": "What does the financial picture look like currently?"},
    {"speaker": "client",  "text": "I make 430,000 a year as a partner at a pediatric group. That's been the case for two years — before that I was employed and making about 280K. I've been maxing out my 401k for four years. Current balance is about 160,000. Outside of that, I have roughly 55,000 in a brokerage account that I opened two years ago. Home equity — we have about 180,000 in equity. No debt anymore except the mortgage — about 320,000 left on a house worth 600K."},
    {"speaker": "advisor", "text": "No 529 accounts for the kids yet?"},
    {"speaker": "client",  "text": "No — it's embarrassing. Rohan is ten. I've been so focused on paying off loans I never started the 529s. College is eight years away for him and I'm starting from zero."},
    {"speaker": "advisor", "text": "It's not too late — eight years is buildable. What's your risk tolerance?"},
    {"speaker": "client",  "text": "High. I have a 20-year horizon for retirement, we have stable income, and I'm willing to accept volatility for growth. I don't panic sell — I actually bought more in March 2020 when the market crashed. Aggressively growth-oriented at this stage."},
    {"speaker": "advisor", "text": "What's your primary retirement goal?"},
    {"speaker": "client",  "text": "I want to retire at 62 — so 18 years. I'd like to have 4 to 5 million in investable assets by then. Given what I can now contribute, I want to make sure I'm using every tax-advantaged vehicle available to me."},
    {"speaker": "advisor", "text": "Are you aware of the backdoor Roth IRA and mega backdoor 401k options for high earners?"},
    {"speaker": "client",  "text": "Vaguely, yes. My CPA mentioned backdoor Roth but we haven't implemented it. I want to do that and I've heard there's a solo 401k option through my practice as well. I want everything on the table."},
    {"speaker": "advisor", "text": "Any estate planning or insurance gaps we should address?"},
    {"speaker": "client",  "text": "We have term life insurance — I have a 2 million dollar policy and Vikram has 500K. We do have wills, updated last year after we had our second child. We're in decent shape there I think."},
]

# ─────────────────────────────────────────────────────────────────────────────
# SCENARIO 7 — George & Patricia Sullivan, Retiree Portfolio Rebalancing
# George 68, Patricia 64.  Retired.  $3.1M portfolio that's too aggressive.
# $130K income need. Social Security + pension.  Estate. Grandkids 529s.
# ─────────────────────────────────────────────────────────────────────────────
GEORGE_PATRICIA_SULLIVAN = [
    {"speaker": "advisor", "text": "George, Patricia — so glad you came in. It sounds like you've been thinking about making some changes to your portfolio?"},
    {"speaker": "client",  "text": "Yes. I'm George Sullivan — I'm 68. This is my wife Patricia, she's 64. We retired three years ago and we've been watching our investment account swing wildly. We lost over 400,000 on paper last year and we couldn't sleep. We think we're invested too aggressively."},
    {"speaker": "advisor", "text": "That anxiety is a very common signal that the allocation doesn't match your risk tolerance in retirement. Let me get some context — contact info first?"},
    {"speaker": "client",  "text": "Sure. george.sullivan.retired@gmail.com. My cell is 858-729-4150."},
    {"speaker": "advisor", "text": "What does your current portfolio look like?"},
    {"speaker": "client",  "text": "About 3.1 million dollars in our investment accounts — 2.4 million in my rollover IRA and about 700,000 in a joint taxable brokerage. Currently we're about 78 percent in equities and 22 percent in bonds and cash. We know that's too much equity for retirees who are drawing income."},
    {"speaker": "advisor", "text": "What income sources do you currently have coming in?"},
    {"speaker": "client",  "text": "I receive Social Security — 2,650 a month. Patricia isn't on SS yet — she'll claim at 67 for maximum benefit, which should be about 1,850 per month. I have a small pension from my old employer — 1,400 a month. So between SS and pension we get about 4,050 combined monthly, rising to about 5,900 when Patricia claims."},
    {"speaker": "advisor", "text": "And what do you need to spend annually to live comfortably?"},
    {"speaker": "client",  "text": "We've been spending about 130,000 a year. About a third of that is discretionary — travel, grandkids. The rest is fixed — mortgage, insurance, healthcare, utilities. We expect to spend a bit more when Patricia retires fully and we travel more, maybe 145K."},
    {"speaker": "advisor", "text": "Do you own your home?"},
    {"speaker": "client",  "text": "We have a condo in La Jolla. Mortgage has 210,000 left on it at 3.1%. Market value is probably 850,000. We've thought about selling it — downsizing — to free up cash and simplify, but haven't decided yet."},
    {"speaker": "advisor", "text": "Walk me through your risk situation — the 78% equity allocation. Was that intentional or did it drift there?"},
    {"speaker": "client",  "text": "It drifted. When I retired it was maybe 65-35. Then the bull run from 2020 to 2022 pushed equities way up and we never rebalanced. By the time we noticed, it was already 78%. The 2022 pullback hurt. The 2024 volatility scared Patricia significantly."},
    {"speaker": "advisor", "text": "What allocation target feels right to both of you going forward?"},
    {"speaker": "client",  "text": "We've talked about it. We're thinking 50-50 equities to fixed income and alternatives. Conservative income generation. We still want some growth to protect against inflation over a 25-year retirement, but we don't want the wild swings anymore."},
    {"speaker": "advisor", "text": "You mentioned grandkids earlier — is there a legacy or education component?"},
    {"speaker": "client",  "text": "Yes — we have four grandchildren ages 2 through 11. We'd love to set up 529 accounts for each of them. Maybe 50 or 60 thousand total across the four. And we want to talk about whether an irrevocable trust or some kind of estate plan makes sense given the size of the estate."},
    {"speaker": "advisor", "text": "Any estate planning documents in place?"},
    {"speaker": "client",  "text": "Yes — we have wills, healthcare directives, and a revocable living trust that we set up in 2018. Our estate attorney said the trust needs to be reviewed given how much larger the estate is now than when we set it up. We just haven't gotten around to it."},
]

# ─────────────────────────────────────────────────────────────────────────────
# Registry — maps short name → transcript list
# ─────────────────────────────────────────────────────────────────────────────
SCENARIOS: dict[str, list[dict[str, str]]] = {
    "sarah_chen":             SARAH_CHEN,
    "robert_linda_hayes":     ROBERT_LINDA_HAYES,
    "marcus_williams":        MARCUS_WILLIAMS,
    "jennifer_reyes":         JENNIFER_REYES,
    "david_huang":            DAVID_HUANG,
    "dr_priya_patel":         DR_PRIYA_PATEL,
    "george_patricia_sullivan": GEORGE_PATRICIA_SULLIVAN,
}

SCENARIO_DESCRIPTIONS: dict[str, str] = {
    "sarah_chen":               "Tech executive, 35 • aggressive • $850K AUM • early-retirement, equity concentration",
    "robert_linda_hayes":       "Pre-retirement teachers, 58/56 • conservative • $680K 401k + pension • SS bridge",
    "marcus_williams":          "Entrepreneur post-exit, 48 • moderate-aggressive • $4.2M sale + $400K • charitable DAF + estate",
    "jennifer_reyes":           "Divorce settlement, 42 • cautious-moderate • $1.1M • college + income + compliance flag",
    "david_huang":              "Inheritance recipient, 36 • moderate • $2.3M • ESG focus, no prior investing",
    "dr_priya_patel":           "Physician catch-up, 44 • aggressive • ~$215K • loans paid, 529 zero-start, backdoor Roth",
    "george_patricia_sullivan": "Retirees rebalancing, 68/64 • conservative • $3.1M • too-aggressive drift, income + estate",
}
