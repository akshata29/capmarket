"""
David Huang — Multi-Meeting Journey (Meetings 2 through 6)

Building on the initial prospecting meeting (DAVID_HUANG in profiles.py),
this module captures David's journey from paralyzed inheritor to confident
wealth steward — influenced by his values, his growing family, and unexpected
opportunities from his grandfather's foresighted investments:

  M2  Onboarding / ESG Portfolio + Home Prep   Jan 2024  — 3 weeks after M1
  M3  Home Closing Review                       Sep 2024  — $1.38M Seattle home closed
  M4  Baby Announcement                         Apr 2025  — Amy 10 weeks pregnant
  M5  Commercial Property Offer                 Aug 2025  — buyer at $1.8M, should he sell?
  M6  Startup Liquidity Event                   Jan 2026  — grandfather's startup acquired

Key themes:
  - Decision paralysis to process and conviction
  - ESG investing as value expression, not just constraint
  - Building a family raises the stakes of every financial decision
  - The commercial property as asset, income source, and emotional inheritance
  - Unexpected windfalls from the grandfather's forgotten venture investment
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# MEETING 2  —  Onboarding / ESG Portfolio Construction + Home Prep
# Date: mid-January 2024 (~3 weeks after M1)
# Meeting type: onboarding
# Context: Both David and Amy attend. The $1.495M cash is ready to deploy.
#   David wants ESG-aligned investing throughout. Amy is systematic and
#   data-oriented — she will ask the right questions. Home purchase (Seattle,
#   $1.2-$1.4M target) is 12-18 months out. Commercial property generates
#   $8,200/month in David's one-third share.
#   Sentiment: careful, intellectually curious, Amy-driven precision.
# ---------------------------------------------------------------------------
HUANG_M2_ONBOARDING = [
    {"speaker": "advisor", "text": "David, Amy — welcome back. I'm glad you're both here. I've spent two weeks building an investment plan specifically designed around your ESG priorities and the home purchase timeline. Ready to walk through it?"},
    {"speaker": "client",  "text": "We made a list of every question we had since the first meeting. Amy organized it by topic."},
    {"speaker": "client",  "text": "I'm an engineer. I made a spreadsheet. I also independently verified that the fund families you'll likely recommend have credible ESG screening processes. I'm going in with eyes open."},
    {"speaker": "advisor", "text": "Amy, I appreciate that due diligence — it makes my job easier. Let me present the framework first, then we'll field every question on your list. The one point four nine five million in cash will be deployed in four tranches over twelve months to dollar-cost average into the market. The target allocation reflects David's moderate risk profile and ESG priorities: forty-five percent diversified global ESG equity, twenty-five percent ESG fixed income including green bonds, fifteen percent impact investing funds with direct positive impact mandates, and fifteen percent cash-equivalent for the home down payment reserve."},
    {"speaker": "client",  "text": "I want to understand what 'ESG equity' actually means in practice. How do you screen out harmful companies?"},
    {"speaker": "advisor", "text": "The funds I'm recommending use a combination of negative screening — excluding weapons manufacturers, thermal coal producers, tobacco companies — and positive tilting, which overweights companies with strong environmental and social scores. The primary funds are Parnassus Core Equity, TIAA-CREF Social Choice, and iShares MSCI USA ESG Select. Each of these publishes its full holdings quarterly and discloses its screening methodology."},
    {"speaker": "client",  "text": "Those three are on my verified list. The Parnassus fund is consistently mentioned in academic research on ESG performance. I'm comfortable with those."},
    {"speaker": "client",  "text": "Amy did three hours of research on ESG fund methodologies last Tuesday evening. I just want to be transparent about that."},
    {"speaker": "advisor", "text": "That rigor will serve both of you well as investors. The fifteen percent impact allocation — this is the most values-expressive part of the portfolio. I'd recommend a community development financial institution fund, a renewable energy infrastructure fund, and a clean water access fund. These have lower liquidity and slightly higher fees but direct measurable impact on real-world outcomes."},
    {"speaker": "client",  "text": "My grandfather cared deeply about clean water access after growing up in a region with water scarcity. This is exactly the kind of thing I want to continue in his memory. Yes to all three."},
    {"speaker": "advisor", "text": "Good. On the commercial property in Bellevue — your one-third interest generating eight thousand two hundred per month. That's ninety-eight thousand four hundred per year to you in rental income. I want to confirm: is this a triple-net lease structure where the tenant pays operating costs?"},
    {"speaker": "client",  "text": "Yes, triple-net. The building management company handles everything. I receive a check — I've been depositing it into a regular savings account and not thinking about it because I didn't know what to do with it."},
    {"speaker": "advisor", "text": "Almost one hundred thousand dollars per year parking in a savings account. We need to redirect that immediately. That income should be flowing into a separately managed taxable account investing systematically — the commercial property cash flow should be working as hard as the inherited capital."},
    {"speaker": "client",  "text": "I didn't conceptualize the rental income as a continuous investment problem. I thought of it as just money that came in. That reframe changes how I think about the whole property."},
    {"speaker": "advisor", "text": "On the Bellevue property — do you know the other two-thirds owners? And do you have any agreement about how partnership decisions get made?"},
    {"speaker": "client",  "text": "My grandfather's attorney is managing the estate process. My sister owns another third and a cousin owns the final third. There's a partnership agreement that requires unanimous consent for major decisions like selling. We haven't all been in a room together since the will reading."},
    {"speaker": "advisor", "text": "That unanimity requirement is important context. If you ever wanted to sell your interest, you'd need all three to agree. That creates complexity. I'd recommend you connect with the managing attorney and understand the current property valuation and any capital event triggers. That will matter if a buyer ever approaches the partnership."},
    {"speaker": "client",  "text": "The attorney sent a valuation report last fall. The building was appraised at two point four million. My third would be approximately eight hundred thousand."},
    {"speaker": "advisor", "text": "At eight hundred thousand valuation and ninety-eight thousand in annual income, that's a twelve point three percent yield on asset value — an extraordinary return by any real estate standard. Unless you need liquidity urgently, holding this property may be the highest-returning asset in your entire portfolio."},
    {"speaker": "client",  "text": "My grandfather built it for cash flow. He said 'own things that produce income while you sleep.' I feel like I finally understand what he meant."},
    {"speaker": "advisor", "text": "Now — the home purchase. Seattle, twelve to eighteen months. Three hundred thousand in the down payment reserve. Amy, you mentioned you're both looking in the one point two to one point four million range?"},
    {"speaker": "client",  "text": "Yes. We want to be in Seattle — good walkability, close to our jobs. Capitol Hill or Fremont would be ideal. We want a place we could grow into, potentially have kids in."},
    {"speaker": "advisor", "text": "At twenty percent down on one point three five million, you need two hundred seventy thousand. Your fifteen percent allocation in the portfolio is two hundred twenty-four thousand dollars. I'm slightly short — let me add forty-six thousand from the commercial property cash flow account over the next six months and the down payment bucket will be fully funded well before you're ready to buy."},
    {"speaker": "client",  "text": "We plan to apply for pre-approval in September. That gives us six to seven months to build the down payment to full."},
    {"speaker": "advisor", "text": "Perfect timeline. David, Amy — I want to say something directly. In our first meeting David told me he'd been frozen for six months because he didn't want to make a mistake with his grandfather's legacy. Today we've built a plan that extends that legacy: ESG investing aligned with his grandfather's renewable energy values, clean water impact investments, and a commercial property strategy that honors the income-first philosophy he built. This is not just portfolio construction — this is continuity."},
    {"speaker": "client",  "text": "I hadn't thought about it that way but you're right. This is grandfather's philosophy expressed in a new generation. Thank you for seeing that."},
]

# ---------------------------------------------------------------------------
# MEETING 3  —  Home Closing Review
# Date: September 2024 (~8 months after onboarding)
# Meeting type: portfolio_review
# Context: David and Amy closed on a Seattle home (Capitol Hill area) for
#   $1.38M with $276K down (20%). First mortgage payment is October 1st.
#   Amy is in her new engineering role with a raise to $175K. David's role
#   has expanded at his IP law firm; likely on partner track. The
#   commercial property value has been confirmed at $2.4M with recent
#   comparable sales. Post-closing financial picture needs updating.
#   Sentiment: nesting satisfaction, slightly wide-eyed at the mortgage.
# ---------------------------------------------------------------------------
HUANG_M3_HOME_CLOSING = [
    {"speaker": "advisor", "text": "David — you closed. Welcome to homeownership. How was the experience?"},
    {"speaker": "client",  "text": "Four weeks of the most stressful due diligence of my life, including one point two trillion neural connections being used to understand esoteric mortgage disclosures that I draft client contracts about for a living and still found confusing. But we closed. We have a home."},
    {"speaker": "advisor", "text": "That's universal. Let me update the financial picture and make sure everything is balanced correctly post-closing. Walk me through what happened on the numbers."},
    {"speaker": "client",  "text": "Final purchase price one million three hundred eighty thousand dollars. Down payment two hundred seventy-six thousand — twenty percent exactly as planned. Mortgage at seven point one percent on one million one hundred four thousand — monthly payment is six thousand eight hundred twenty per month including taxes and insurance."},
    {"speaker": "advisor", "text": "Six thousand eight hundred twenty per month. Your combined income is David at one hundred ninety-five thousand and Amy now at one hundred seventy-five thousand — three hundred seventy thousand combined. After six thousand eight hundred a month in mortgage, you're well within the generally accepted housing cost guideline, though it's a meaningful commitment."},
    {"speaker": "client",  "text": "We ran our budget. After mortgage, utilities, food, and all fixed expenses, we have about six thousand five hundred dollars a month remaining. That's our savings and lifestyle buffer. It's workable but it doesn't feel lavish the way a three-hundred-seventy-thousand income sounds on paper."},
    {"speaker": "advisor", "text": "That compression is very normal in high-cost-of-living cities. It doesn't last — incomes grow, mortgage stays fixed, and the effective housing cost burden declines over time. In five years at reasonable income progression, you'll feel substantially less stretched. Let me update the full balance sheet."},
    {"speaker": "client",  "text": "I need to know what happened to the invested portfolio from the closing. We used two hundred seventy-six thousand from the down payment reserve bucket. What's left?"},
    {"speaker": "advisor", "text": "Before the draw, your investment portfolio was one million six hundred thousand including eight months of contributing commercial property cash flow. After the down payment withdrawal, the invested portfolio stands at one million three hundred twenty-four thousand. Additionally, your home equity is two hundred seventy-six thousand on day one. Net worth including the commercial property at eight hundred thousand valuation: approximately two point four million. Total picture."},
    {"speaker": "client",  "text": "Two point four million at thirty-six years old. I remember sitting in this office in January saying I hadn't touched the money because I was afraid of making a mistake. I don't feel that way anymore."},
    {"speaker": "advisor", "text": "Good. Because the next decision worth thinking about is the commercial property. Have you been in contact with the other two partners since closing on the house?"},
    {"speaker": "client",  "text": "Yes — my sister called last month. She received an inquiry from a real estate developer who wants to buy the entire building. They haven't made a formal offer but they expressed strong interest. My sister is curious to explore it. Our cousin is ambivalent."},
    {"speaker": "advisor", "text": "When a developer makes an approach before making a formal offer, the strategy is to let them come back with a number without signaling how interested you are. Don't respond with eagerness. Your property is generating twelve percent annual yield — any buyer knows that and will discount the urgency of your response. Let them make the first number."},
    {"speaker": "client",  "text": "I'll tell Eva — my sister — exactly that. We have no urgency to sell. Let them show us their number."},
    {"speaker": "advisor", "text": "If the number is compelling, we'll have a full analysis ready: capital gains tax on your basis, a 1031 exchange option to defer those gains, and a net-proceeds deployment plan. I want you to be completely prepared before that conversation gets real."},
    {"speaker": "client",  "text": "What's the 1031 exchange concept? I've heard it mentioned but never understood it."},
    {"speaker": "advisor", "text": "A Section 1031 like-kind exchange lets you sell a real estate investment property and defer all capital gains taxes if you reinvest into another qualifying real property within a strict timeline — forty-five days to identify a replacement property, one hundred eighty days to close. Your taxable gain on the commercial property remains in your estate until you eventually sell the replacement property, or pass it to heirs with a stepped-up basis. It's one of the most powerful tax deferral tools in real estate."},
    {"speaker": "client",  "text": "So if we sell for the right number, we can defer the taxes and keep the full proceeds working in a replacement property rather than paying a large capital gains bill immediately. That changes the calculus on selling versus holding considerably."},
    {"speaker": "advisor", "text": "Exactly — and your attorney background means you can absorb the complexity of this transaction more easily than most clients. I'll prepare a 1031 primer document for when the formal offer arrives. For now — congratulations on the house. Capitol Hill is a wonderful neighborhood to build a life in."},
]

# ---------------------------------------------------------------------------
# MEETING 4  —  Baby Announcement
# Date: April 2025 (~15 months after onboarding)
# Meeting type: planning
# Context: Amy is 10 weeks pregnant, due October 16, 2025. The news makes
#   every prior financial decision feel newly anchored. Life insurance needs
#   to be established if not already done. Will needs to be created. 529
#   account should be opened before birth. Seattle house suddenly feels
#   exactly right. David is quiet with emotion; Amy is characteristically
#   systematic about the to-do list.
#   Sentiment: joy threading through careful practical planning.
# ---------------------------------------------------------------------------
HUANG_M4_BABY_ANNOUNCEMENT = [
    {"speaker": "advisor", "text": "You both look like you're sitting on news. David, you asked for an urgent appointment. What's happening?"},
    {"speaker": "client",  "text": "Amy is ten weeks pregnant. Due date is October sixteenth. We're expecting our first child."},
    {"speaker": "advisor", "text": "Congratulations to you both — this is genuinely wonderful. I'll stay professional, but this is genuinely wonderful. October sixteenth — that gives us six months to make sure the financial scaffolding is correct for a new person joining this household."},
    {"speaker": "client",  "text": "I made a checklist. There are nine items. Should I read them or should you lead?"},
    {"speaker": "advisor", "text": "Read your list and I'll respond to each one. You've done this kind of preparation — let's use it."},
    {"speaker": "client",  "text": "One: life insurance for both of us. Two: update wills with guardian designation. Three: 529 account setup. Four: childcare budget planning for Seattle. Five: maternity and paternity leave financial impact. Six: estate trust for the baby's protection. Seven: update beneficiaries everywhere. Eight: disability insurance review. Nine: anything I missed."},
    {"speaker": "advisor", "text": "That is a near-perfect list. Let's go through them in order. Life insurance: David, you have no personal life insurance in place from what I know. Amy?"},
    {"speaker": "client",  "text": "Amy has a two-times-salary policy through her employer — about three hundred fifty thousand. I have nothing. I kept meaning to apply and kept procrastinating."},
    {"speaker": "advisor", "text": "The time is now — literally. Once you have a child, the income replacement need is significant. For both of you as dual-income professionals with a one-point-three-million-dollar mortgage, I'm recommending two million each in term life. At your ages and health profile, the combined annual premium is approximately fourteen hundred to seventeen hundred dollars per year. I'll start the applications today."},
    {"speaker": "client",  "text": "Amy's employer policy counts toward her two million? Or separate?"},
    {"speaker": "advisor", "text": "Group employer policies are supplemental — they're not portable if she changes jobs. I want the full two million in private term separate from her employer benefit. Total coverage including the employer policy becomes two million three hundred fifty thousand for Amy, which is appropriate given the mortgage."},
    {"speaker": "client",  "text": "Three: the 529. Can we open it before the baby is born?"},
    {"speaker": "advisor", "text": "Yes — and I'd recommend doing so this week. You need a Social Security number for the beneficiary, but some 529 plans allow you to designate the account without one temporarily and update it at birth. California's ScholarShare allows this. But since you're in Washington and I'd recommend Washington's DreamAhead plan — let me check. In some cases you can name a placeholder beneficiary and transfer after birth."},
    {"speaker": "client",  "text": "We'll do it the moment we have the Social Security number. How much to open with?"},
    {"speaker": "advisor", "text": "Open with twenty-five thousand and commit to ten thousand per year going forward. At ten thousand per year over eighteen years at seven percent growth, you'll have approximately four hundred thousand dollars at college enrollment — more than enough to fund four years at any institution with breathing room."},
    {"speaker": "client",  "text": "Four: childcare in Seattle. We looked at infant daycare within walking distance of our neighborhood and the cost is four thousand to forty-four hundred per month."},
    {"speaker": "advisor", "text": "That is the Seattle market rate for quality infant care — forty-eight to fifty-three thousand dollars per year. This is the largest single new budget line entering your household. At your combined income of three hundred seventy thousand, it's manageable but it will compress your monthly savings rate substantially. I want to rebuild the budget model incorporating this number so you go in with clear eyes."},
    {"speaker": "client",  "text": "We've been saving aggressively since the mortgage. Our monthly surplus after everything is about six thousand five hundred. Daycare at four thousand takes that to two thousand five hundred. We'd be saving much less but we're not in the red."},
    {"speaker": "advisor", "text": "Correct — and the benefit of the surplus you built is that you have eighteen months before daycare costs begin to peak. Your savings in the next six months can build a buffer that smooths the transition. I'll update the model with these numbers."},
    {"speaker": "client",  "text": "Five and six — leave planning and estate trust. Amy gets twelve weeks fully paid by her employer. I get six weeks paid by my firm. After that, Amy is considering an additional six weeks unpaid."},
    {"speaker": "advisor", "text": "Twelve weeks fully paid for each of you, staged — that means you can cover almost twelve months with overlap if you stagger the leave. The unpaid six weeks for Amy at one hundred seventy-five thousand salary costs approximately twenty thousand in gross income. With your savings buffer, that's entirely manageable. On the estate trust — I want you both to see the estate attorney this month. You need wills with guardian designation and a testamentary trust. David — who would you name as guardian?"},
    {"speaker": "client",  "text": "My sister Eva. We've spoken about this. Amy's parents live in Taiwan and would not be able to take on a child. Eva is in Seattle and she's agreed."},
    {"speaker": "advisor", "text": "Schedule the attorney meeting before the second trimester ends — that's my firm recommendation for timeline. You are both IP and legal professionals. You know better than most that legal documents are not completed by good intentions. Set the appointment this week."},
    {"speaker": "client",  "text": "That one is yours, David. I'm putting it in the calendar right now."},
    {"speaker": "client",  "text": "Done. Thursday the fourteenth of May."},
    {"speaker": "advisor", "text": "Nine: what you missed. Disability insurance. David, your firm's disability policy — does it cover sixty to seventy percent of your income to age sixty-five?"},
    {"speaker": "client",  "text": "I honestly have no idea. I'll find out this week."},
    {"speaker": "advisor", "text": "I need to see that summary plan description. For a high-earning professional with a large mortgage and a child on the way, disability insurance is the most underappreciated protection most people have. If you're underinsured there, a personal disability policy tops up the gap. We'll discuss at the next meeting. Congratulations again, both of you — this is a remarkable time."},
]

# ---------------------------------------------------------------------------
# MEETING 5  —  Commercial Property Offer
# Date: August 2025 (~19 months after onboarding)
# Meeting type: planning
# Context: The Bellevue developer has returned with a formal offer: $1.8M
#   for the entire commercial building. That is David's one-third share at
#   $600K. The property was worth $800K individually (one-third of $2.4M
#   valuation). The offer implies a $2.1M discount on the full building —
#   this is a discounted offer because they know owners may want liquidity.
#   David's sister Eva wants to sell. The cousin is undecided.
#   Baby Oliver arrived healthy in October 2024. David is tired but happy.
# ---------------------------------------------------------------------------
HUANG_M5_PROPERTY_OFFER = [
    {"speaker": "advisor", "text": "David — you look tired in the best possible way. The new parent look. How is Oliver?"},
    {"speaker": "client",  "text": "He is ten months old and I have not slept more than five consecutive hours since October. Life is completely different with him here. But that's actually relevant to this conversation — we're being asked to make a significant real estate decision and my brain is operating at reduced capacity."},
    {"speaker": "advisor", "text": "Then let's be especially systematic today. Tell me about the offer."},
    {"speaker": "client",  "text": "The developer came back with a formal offer of one point eight million for the entire building. My one-third share of that is six hundred thousand. But my estimated share of current value is eight hundred thousand — one-third of the twenty-four hundred thousand appraisal we discussed. So this offer is two hundred thousand below what my stake is worth."},
    {"speaker": "advisor", "text": "You've done the math correctly. The developer is offering one point eight million for an asset appraised at two point four million — a twenty-five percent discount. That discount represents what developers call 'assemblage premium' — they need all three parties to agree, and they're pricing that complexity into the offer. The question is whether six hundred thousand today versus holding the asset is the right decision."},
    {"speaker": "client",  "text": "What would we be giving up by selling at this discounted price?"},
    {"speaker": "advisor", "text": "The annual income from your share is ninety-eight thousand four hundred. If you sell at six hundred thousand, your after-tax proceeds — assuming a cost basis of approximately three hundred thousand net of estate settlement values — would trigger a capital gain of approximately three hundred thousand, generating a federal tax bill of around seventy-two thousand. You net five hundred twenty-eight thousand."},
    {"speaker": "client",  "text": "Five hundred twenty-eight thousand versus holding an asset generating ninety-eight thousand per year. That's a payback period of under six years."},
    {"speaker": "advisor", "text": "With one major caveat: the ninety-eight thousand is rental income taxed at ordinary rates, not capital gains rates. At your combined income level, that income faces approximately thirty-five to thirty-seven percent federal and state effective rate — net cash flow is closer to sixty-three to sixty-five thousand per year after tax. Payback on the discounted sale drops to about eight years at that rate."},
    {"speaker": "client",  "text": "Eva wants to sell. She's a physician in Boston, she doesn't want the management complexity even though it's triple-net and virtually passive. The cousin is fifty-fifty."},
    {"speaker": "advisor", "text": "The unanimity requirement means you have leverage you're not using. If you're willing to hold, you're not obligated to sell at this price. Eva wanting to sell is actually your greatest negotiating asset — propose that the developer increase the offer by at least three hundred thousand to reflect the true appraised value, or structure a partial buyout of Eva's interest where you acquire her third through a seller-finance arrangement and become a two-thirds owner with better economics."},
    {"speaker": "client",  "text": "I could buy Eva's third? How would that work?"},
    {"speaker": "advisor", "text": "Eva sells her one-third share to you at fair value — eight hundred thousand — financed over ten years at a family-agreed rate. You now own two-thirds of the building, your rental income increases to one hundred ninety-six thousand per year, and Eva has her liquidity without needing a developer sale at a discount. The cousin continues as one-third minor partner."},
    {"speaker": "client",  "text": "That is the most interesting option I've heard in months and it didn't occur to me at all. How do I know if I can service the financing of eight hundred thousand?"},
    {"speaker": "advisor", "text": "At your two combined incomes and with the existing rental cash flow increasing to cover most of the financing cost, the debt service is very manageable. And importantly — you're not selling a twelve percent yielding asset at a twenty-five percent discount because a developer lowballed you. Let me model both scenarios in detail and I'll send you the analysis before you respond to Eva or the developer."},
    {"speaker": "client",  "text": "My grandfather never sold assets he didn't have to sell. I think he would endorse this approach."},
    {"speaker": "advisor", "text": "I think you're right. Let me also revisit the 1031 exchange contingency — in case the developer counters meaningfully above the original offer, you'll want to know the exact tax cost and what a 1031 replacement would look like in today's Seattle market. Full analysis by Thursday."},
]

# ---------------------------------------------------------------------------
# MEETING 6  —  Startup Liquidity Event
# Date: January 2026 (~24 months after onboarding)
# Meeting type: planning
# Context: The grandfather's medical device startup (a position in his estate)
#   has been acquired by a larger medical device corporation. David's
#   inherited fractional interest in the startup — illiquid and essentially
#   forgotten as speculative — turns out to be worth approximately $380K
#   in the acquisition proceeds. The family attorney notified David last
#   week. This is an unexpected windfall. What to do with it?
#   Eva internal family buyout negotiation is in progress. Oliver is 15 months old.
# ---------------------------------------------------------------------------
HUANG_M6_STARTUP_WINDFALL = [
    {"speaker": "advisor", "text": "David — you sounded surprised on the phone. What happened?"},
    {"speaker": "client",  "text": "My grandfather's medical device startup — the illiquid private equity that we listed as speculative and essentially forgot about — was acquired last month. The family attorney notified me last week. My share of the acquisition proceeds is three hundred eighty thousand dollars. It's coming through the estate first and then distributed to me, probably within sixty days."},
    {"speaker": "advisor", "text": "That is a genuinely wonderful surprise. And it's meaningful: three hundred eighty thousand dollars. Let me understand the tax picture first. What is the cost basis on this asset through the estate?"},
    {"speaker": "client",  "text": "My attorney believes the basis is the fair market value as of my grandfather's death date — which is what we received it at in the estate inventory. At that time, the startup had essentially no liquid market value. The basis was recorded as nearly nominal."},
    {"speaker": "advisor", "text": "If the basis is nominal and the proceeds are three hundred eighty thousand, you likely have a capital gain approaching the full three hundred eighty thousand. The character of the gain — ordinary versus capital — depends on how the acquisition was structured. You need your CPA on this quickly. If it's a stock acquisition on your end and the holding period from estate valuation date is more than twelve months, it would be long-term capital gain."},
    {"speaker": "client",  "text": "The attorney flagged this as long-term capital gain treatment — the estate has held the underlying interest for over two years and my inheritance date was in mid-2023."},
    {"speaker": "advisor", "text": "Long-term capital gains at your income level: twenty percent federal plus three point eight percent net investment income tax. No state income tax in Washington. Approximate federal tax: about ninety thousand dollars. Net proceeds after tax: approximately two hundred ninety thousand."},
    {"speaker": "client",  "text": "Two hundred ninety thousand. That is genuinely unexpected capital. I've been thinking about it since I heard the news and I have an idea about where I want it to go."},
    {"speaker": "advisor", "text": "Tell me."},
    {"speaker": "client",  "text": "I want to use this to fund part of the Eva family buyout. We've been in conversations and she's agreed in principle to sell her one-third of the Bellevue building to me for seven hundred fifty thousand — below the eight hundred thousand appraised value as a family discount. If I put two hundred ninety thousand toward the down payment on that purchase and finance the remaining four hundred sixty thousand, the financing cost drops substantially and the income-to-debt-service ratio looks excellent."},
    {"speaker": "advisor", "text": "David, that is the single best possible use of this capital. Let me run the numbers in real time. You're acquiring an additional one-third of a building generating roughly one hundred ninety-six thousand in annual rental income for the two-thirds share. Your debt service on four hundred sixty thousand at a family note interest rate might be around twenty-eight thousand per year. Net cash flow to you after all costs on the two-thirds share: approximately ninety-eight thousand per year after tax. Your return on invested capital is extraordinary."},
    {"speaker": "client",  "text": "My grandfather bought this building thirty years ago for income. I'm now going to own two-thirds of a building he bought, using proceeds from a startup he funded with the income from that same building. The money made a complete circle."},
    {"speaker": "advisor", "text": "That is exactly the kind of generational wealth continuity that intentional wealth management makes possible. What about the remaining two hundred ninety thousand in the taxable portfolio plus the original allocation — how are you thinking about the overall picture?"},
    {"speaker": "client",  "text": "After the buyout we'll have about zero in new investable capital from this windfall — it all goes to Eva. But the commercial property income nearly doubles, which becomes new monthly savings flow. I want to reroute that increased income directly into Oliver's 529."},
    {"speaker": "advisor", "text": "The 529 is currently at forty-six thousand after fifteen months of contributions. Redirecting even forty thousand per year from the increased property income toward college funding would grow that account to over eight hundred thousand at Oliver's college enrollment assuming regular returns. Your son's college is fully funded before he can talk."},
    {"speaker": "client",  "text": "My grandfather didn't go to college. He built a building instead. But he would have wanted his great-grandchild to have every door open. I find that profoundly meaningful."},
    {"speaker": "advisor", "text": "You've made the right instincts into a financial architecture. Two years ago you walked in frozen, afraid to touch money you didn't feel was yours yet. Today you're building generational wealth and honoring the person who created the foundation for it. That is what this work is for."},
]
