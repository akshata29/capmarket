"""
Sarah Chen — Multi-Meeting Journey (Meetings 2 through 6)

Building on the initial prospecting meeting (SARAH_CHEN in profiles.py),
this module captures the full arc of Sarah's relationship with her advisor
over approximately 24 months:

  M2  Onboarding / Strategy Session      Jan 2024  — 2 weeks after M1
  M3  Market Downturn Emergency Check-in  Sep 2024  — tech sector correction
  M4  Life Change: Engagement             Mar 2025  — meets Michael Torres
  M5  Annual Review                       Jun 2025  — 18-month progress review
  M6  Major Life Event: Baby on the Way   Jan 2026  — expecting first child

Key themes across the arc:
  - Sentiment evolution: optimism -> anxiety -> relief -> joy -> grounded calm
  - Concentration risk: 70% single-stock -> systematic diversification -> 38%
  - FIRE target: solo age-45 -> coupled 44.6 -> family-first age-50
  - Life complexity: single/no dependents -> engaged -> expecting -> buying home
  - Portfolio growth: $850K -> $950K (dip to $820K) -> $1.47M combined
  - Risk profile: aggressive solo -> blended moderate-aggressive with Michael
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# MEETING 2  —  Onboarding / Investment Policy Statement Session
# Date: early January 2024 (~2 weeks after the initial prospecting meeting)
# Meeting type: onboarding
# Context: Sarah has decided to move forward.  Advisor presents the drafted
#   Investment Policy Statement, RSU diversification rule, tax plan, emergency
#   fund sizing, life-insurance recommendation, will referral, and account
#   transfer steps.  Sentiment: optimistic and engaged, some healthy nerves.
# ---------------------------------------------------------------------------
SARAH_CHEN_M2_ONBOARDING = [
    {"speaker": "advisor", "text": "Sarah, welcome back. Two weeks ago you shared your goals — diversification, early retirement, getting smarter on taxes. I've spent time building a proposal specifically around your situation. Ready to walk through it?"},
    {"speaker": "client",  "text": "Yes, absolutely. I've been thinking about it a lot since we last met. I even made a list of questions."},
    {"speaker": "advisor", "text": "Perfect — we'll get to everything on that list. Let me start with your Investment Policy Statement. This is the governing document for everything we do together. Based on our conversation, I'm proposing a target allocation of sixty percent diversified global equities, thirty percent fixed income and alternatives, and ten percent cash equivalents. That's the destination — we'll work toward it as you vest and diversify over the next eighteen months."},
    {"speaker": "client",  "text": "That feels right, but I'll be honest — I'm still a little uncomfortable selling company stock. It's done very well for me over the years and I know the business intimately."},
    {"speaker": "advisor", "text": "That emotional connection is completely natural and I hear it from almost every tech client. Here's the risk reality though: if your company has a tough year, your salary growth, your bonus, and your portfolio all take a hit simultaneously. That compounding exposure is the specific thing we're managing against. For the RSU diversification, I'm proposing a simple rule — every time RSUs vest, we automatically sell twenty-five percent and redirect it into the managed diversified account. You keep seventy-five percent initially, and over approximately three years we bring single-stock exposure down to thirty percent or below."},
    {"speaker": "client",  "text": "Twenty-five percent at each vest. I can live with that. But what about the six hundred thousand in existing stock I already hold? That's the elephant in the room."},
    {"speaker": "advisor", "text": "Exactly right — that's the larger challenge. We can't liquidate all at once without a brutal tax bill. I'm recommending we sell in five tranches spread across Q4 2024 and the first half of 2025, specifically targeting lots where the holding period qualifies for long-term capital gains treatment. I've modeled it against your expected income and the numbers are meaningful."},
    {"speaker": "client",  "text": "How meaningful are we talking?"},
    {"speaker": "advisor", "text": "By using optimal lot selection and spreading the sales across two tax years, I estimate we reduce your capital gains liability by thirty-eight thousand to forty-two thousand dollars compared to selling it all in a single year. That number is before any tax-loss harvesting offsets we layer on top."},
    {"speaker": "client",  "text": "That's real money. Okay, I'm convinced on the stock plan. What about Bitcoin? I know it's not neat and tidy."},
    {"speaker": "advisor", "text": "We keep it — but we cap it at five percent of your total portfolio. Right now your forty thousand dollar position is about four point seven percent of eight hundred fifty thousand, so you're just inside the limit. It gets its own line in the allocation as speculative alternative. If it appreciates past five percent of total assets, we review trimming at that point."},
    {"speaker": "client",  "text": "Works for me. I'm not looking to add more anyway. Can we talk about the two things I've been procrastinating on? Life insurance and a will."},
    {"speaker": "advisor", "text": "Absolutely, and I'm glad you brought them up. For life insurance — you're single with no dependents, but at your asset level you need to protect your estate against unexpected scenarios. I'm recommending a one million dollar twenty-year term policy. At thirty-five in good health, the monthly premium is approximately twenty-eight dollars."},
    {"speaker": "client",  "text": "Twenty-eight dollars a month? I've been putting this off for two years over twenty-eight dollars a month. That's embarrassing."},
    {"speaker": "advisor", "text": "You'd be surprised how many people do that. I'll have the application sent over this week. On the will — yours needs to be a basic document that names your sister as executor and beneficiary, designates a healthcare proxy, and records your asset wishes. Our estate attorney handles this for about fifteen hundred to two thousand dollars. I'll send a referral today."},
    {"speaker": "client",  "text": "Yes, let's do both. What's our first concrete step to actually get money moving?"},
    {"speaker": "advisor", "text": "I'd like to transfer your existing one hundred thousand dollar brokerage account to our managed platform this week and invest it according to the new target allocation. That's the first concrete deployment. Simultaneously, I'm opening a high-yield savings account for your emergency fund — at your spending level, six months of expenses is about eighty thousand dollars. I want that fully funded and separate from the investment portfolio."},
    {"speaker": "client",  "text": "I have about sixty thousand sitting in a checking account doing nothing. I'll move that to the high-yield savings right away. What rate are they getting these days?"},
    {"speaker": "advisor", "text": "Marcus and Ally are both at five point three percent on savings right now. That sixty thousand generates over three thousand dollars a year in interest, which currently beats inflation on those defensive dollars."},
    {"speaker": "client",  "text": "Done. One last question — I'm an engineer, I like dashboards and data. When do I start seeing actual progress reports?"},
    {"speaker": "advisor", "text": "You'll get full portal access today. Quarterly reports go out in January, April, July, and October. I also want to do a personal mid-year check-in every June. And beyond that — you can log in any time to see your live allocation breakdown, performance against benchmark, and your FIRE progress tracker showing exactly where you stand against the retire-by-forty-five goal."},
    {"speaker": "client",  "text": "A FIRE progress tracker. I love that. This is the first time in my financial life I've felt like I actually have a plan. Thank you."},
    {"speaker": "advisor", "text": "That's exactly what we've built. Welcome aboard, Sarah. Let's make the next ten years count."},
]

# ---------------------------------------------------------------------------
# MEETING 3  —  Market Downturn Emergency Check-in
# Date: September 2024 (~8 months after onboarding)
# Meeting type: portfolio_review (client-initiated, urgent)
# Context: Tech sector has undergone a sharp rotation and correction.
#   Sarah's company stock is down 32%.  Her total portfolio has dropped
#   from a peak of ~$950K (post-RSU vest and growth) to ~$820K — a $130K
#   drawdown on paper.  She called in with visible anxiety.
#   The diversification work done in M2 has already softened the blow.
#   Sentiment arc: anxious/distressed -> thoughtful -> reassured -> empowered.
# ---------------------------------------------------------------------------
SARAH_CHEN_M3_MARKET_DOWNTURN = [
    {"speaker": "advisor", "text": "Sarah, thanks for coming in on short notice. I could hear in your voice that you're feeling the pressure. Let's look at the numbers together and get some context."},
    {"speaker": "client",  "text": "I appreciate you fitting me in. I checked the portfolio this morning and I'm down about a hundred and thirty thousand from my peak. I know intellectually that you told me volatility would happen, but sitting with six figures evaporating over two months is very different in practice than in theory."},
    {"speaker": "advisor", "text": "You're right — the emotional experience of drawdowns is real, regardless of how prepared we think we are. The good news is that your portfolio is set up to weather exactly this kind of event. Let me pull up your allocation attribution."},
    {"speaker": "client",  "text": "Company stock is down thirty-two percent — that's clearly the main driver. I've been checking it every single day, which I know is not helping my anxiety."},
    {"speaker": "advisor", "text": "Step one for your mental health: check it weekly, not daily. Here's a number I want you to focus on instead. When we started in January, your company stock represented seventy percent of your total portfolio. Today, after the RSU proceeds we've diversified over the past eight months, it's down to fifty-eight percent. That twelve-point shift in concentration is protecting you right now."},
    {"speaker": "client",  "text": "I hadn't looked at it that way. So the diversification is actually doing what it was supposed to do."},
    {"speaker": "advisor", "text": "Precisely. Let me put a number on it. The eighteen percent of your portfolio we moved into the diversified account is down only six percent in this correction — it held up. If we had done nothing and you were still seventy percent concentrated, your drawdown today would have been approximately forty thousand dollars worse. That is the direct dollar value of the work we did in January."},
    {"speaker": "client",  "text": "Forty thousand dollars. That's incredibly clarifying to hear. So what do we do now? My first instinct was to stop selling company stock at the vest points since it's lower — is that wrong?"},
    {"speaker": "advisor", "text": "That instinct is completely understandable but it's actually backwards. When your company stock is lower, you are buying diversification at a cheaper effective price relative to your portfolio. I want to keep the twenty-five percent vest-and-sell rule in place — and I'd actually recommend bumping it to thirty percent for the next two vest cycles to take advantage of the lower entry point on reinvestment."},
    {"speaker": "client",  "text": "Okay. What about buying more company stock while it's down? I know the business, I know the fundamentals are solid, and it always bounces back."},
    {"speaker": "advisor", "text": "I hear that argument and I want to push back carefully. The risk isn't whether the stock recovers — it probably does. The risk is that your compensation, your annual RSU grant, and your portfolio are all simultaneously exposed to the same single company. Concentrating further during a downturn is doubling a bet that's already your largest bet. Your ESPP plan at a fifteen percent discount is already giving you company-stock upside in a structured, risk-adjusted way."},
    {"speaker": "client",  "text": "That's fair. What about Bitcoin? It's down to twenty-eight thousand from the forty I put in. That stings on top of everything else."},
    {"speaker": "advisor", "text": "Bitcoin follows its own cycle entirely separate from the tech rotation. At twenty-eight thousand, you're still within your five percent allocation cap. I'd hold it and I'd resist the urge to sell at a loss to offset frustration. We didn't hold Bitcoin for safety — we held it as a speculative allocation and we size-manage it accordingly."},
    {"speaker": "client",  "text": "Okay, I can do that. Is there anything we can actually do today to make a productive move from this situation?"},
    {"speaker": "advisor", "text": "Yes — tax-loss harvesting. In your taxable brokerage account, we have positions sitting at unrealized losses of approximately twenty-two thousand dollars. Harvesting those losses creates tax assets we can deploy against future capital gains. At your marginal rate, the after-tax value of that harvest is eight to nine thousand dollars. I can execute that this week."},
    {"speaker": "client",  "text": "Yes, please do that. Now the question I actually came here to ask — how far does this push back my FIRE timeline?"},
    {"speaker": "advisor", "text": "I ran the projection before this meeting. Your current savings rate, your income after the promotion you mentioned, your expected RSU schedule — the updated model shows you retiring at forty-five point four years instead of forty-five point zero. Four to five months behind plan. That is the mathematical impact of this entire drawdown on your financial independence timeline."},
    {"speaker": "client",  "text": "Four months. I was genuinely afraid it was years. That's — actually I feel much better."},
    {"speaker": "advisor", "text": "The anxiety makes the perceived damage feel much larger than the actual damage. Your fundamentals are unchanged: high savings rate, long time horizon, systematic process, and a promotion that just increased your income. If anything, this correction is hitting while you still have decades of compounding ahead of you. That is the ideal time to experience a drawdown."},
    {"speaker": "client",  "text": "I've never thought about it as the ideal time before. That reframe helps."},
    {"speaker": "advisor", "text": "I'd like to schedule a brief thirty-minute check-in for late October — not because I expect things to be bad, but because having that touchpoint on the calendar often reduces the daily anxiety between now and then. Regular contact is its own form of risk management."},
    {"speaker": "client",  "text": "Yes, let's do that. Having it on the calendar will stop me from obsessively checking the app every day. Thank you for the reality check today — I needed it."},
]

# ---------------------------------------------------------------------------
# MEETING 4  —  Life Change: Engagement  (Michael Torres joins)
# Date: March 2025 (~14 months after onboarding)
# Meeting type: planning
# Context: Sarah is engaged to Michael Torres (37, software architect at Adobe,
#   $185K base + $60K RSUs, $125K total assets).  First combined session.
#   Michael has the same single-stock concentration problem Sarah started with.
#   Prenuptial discussion, joint-account architecture, combined FIRE math,
#   home-purchase analysis, blended risk profile, beneficiary updates.
#   Sentiment: joyful and practical; Michael is initially skeptical but warms up.
# Note on audio: both Sarah and Michael are tagged as "client" — the audio
#   file will use a single client voice channel per current system capability.
# ---------------------------------------------------------------------------
SARAH_CHEN_M4_ENGAGEMENT = [
    {"speaker": "advisor", "text": "Sarah, and you must be Michael — great to finally meet you. Sarah has told me a lot about you. This is an exciting time for both of you."},
    {"speaker": "client",  "text": "Thank you. I'll admit I warned Michael that financial meetings are not normally fun, but here we are."},
    {"speaker": "client",  "text": "I was prepared to be bored but Sarah speaks very highly of what you've done together over the past year, so I'm keeping an open mind."},
    {"speaker": "advisor", "text": "I appreciate that, Michael. Since we're starting fresh with you, let me get the basics — age, employer, and a rough sense of where you stand financially?"},
    {"speaker": "client",  "text": "I'm thirty-seven. I'm a software architect at Adobe — been there six years. Base salary is one hundred eighty-five thousand plus about sixty thousand in RSUs annually. I have ninety-five thousand in my Adobe 401K and roughly thirty thousand in a Vanguard index fund brokerage I manage myself. No debt, no mortgage, I rent here with Sarah."},
    {"speaker": "advisor", "text": "That is a clean balance sheet, Michael — I like it. One thing I want to flag immediately: the Adobe RSUs you mentioned. Are you holding unvested grants, and do you have meaningful vested Adobe stock in your brokerage?"},
    {"speaker": "client",  "text": "About forty-five thousand in unvested Adobe RSUs vesting over the next two years, and I've been sitting on about twenty thousand in vested Adobe equity that I keep meaning to sell but haven't gotten around to."},
    {"speaker": "advisor", "text": "I want to gently point out that you have the exact same concentration risk Sarah walked in with fourteen months ago. When two people in a household both hold significant amounts of employer equity, you've compounded the risk: if the tech sector has a bad year, both of your portfolios and both of your compensation packages get hit at the same time. We need a diversification plan for your side too."},
    {"speaker": "client",  "text": "Sarah showed me her portfolio during the September correction last year and told me I should have done this earlier. I guess I'm finally listening."},
    {"speaker": "client",  "text": "He's a little more stubborn than I was, but he gets there eventually."},
    {"speaker": "advisor", "text": "You are both ahead of average. Let me frame the combined picture. Between Sarah's portfolio, both 401K accounts, and Michael's brokerage, you're sitting at approximately one point three million dollars in combined investable assets. That is a meaningful household balance sheet for two people in your mid-to-late thirties."},
    {"speaker": "client",  "text": "When you put it like that, it sounds real. I think I've been separating my money from her money in my head."},
    {"speaker": "advisor", "text": "That's a very common mental accounting pattern — and it leads to a question I ask every couple I work with at this stage. Have you discussed a prenuptial agreement? I'm not recommending one way or the other, but given the current asset disparity and the different RSU vesting schedules you each have, it's worth a deliberate conversation with a family law attorney before you're married."},
    {"speaker": "client",  "text": "We've actually talked about it. We're both comfortable keeping our existing individual assets in our own names and sharing everything we build together going forward."},
    {"speaker": "client",  "text": "Yeah, we agreed on that pretty quickly. She has significantly more right now — I'll catch up."},
    {"speaker": "advisor", "text": "That's a healthy and common arrangement. From a planning architecture standpoint, what I typically recommend for couples in your situation is three buckets: Sarah's individual portfolio, Michael's individual portfolio, and a joint account for shared goals — home down payment, travel fund, and eventually family expenses. This keeps autonomy clear while building toward shared objectives."},
    {"speaker": "client",  "text": "I like that structure. It's clean and fair."},
    {"speaker": "advisor", "text": "On the home purchase question — you're both renting. With your combined income of roughly five hundred eighty thousand and growing assets, where are you on the decision to buy?"},
    {"speaker": "client",  "text": "We've looked at San Francisco properties. A modest two-bedroom condo in a decent neighborhood is one point one to one point three million. At current mortgage rates that's a very large monthly payment."},
    {"speaker": "client",  "text": "I ran the numbers on a seven percent mortgage on a one-point-two million home. We're looking at about eight thousand a month in mortgage, taxes, and HOA. Our rent today is six thousand. The financial case is not obvious to me."},
    {"speaker": "advisor", "text": "Michael, I think you've done the right math. At current rates and SF prices, the buy-versus-rent case is genuinely close. My recommendation is to hold off for twelve to eighteen months, let rates potentially ease, and meanwhile keep the capital you would have used as a down payment growing in the joint account. If rates drop a point, the same property becomes materially more affordable."},
    {"speaker": "client",  "text": "That gives me permission to stop obsessing about Zillow for a while. I can live with that."},
    {"speaker": "advisor", "text": "Last critical item today — both of your wills and all beneficiary designations. Sarah, yours is the basic single-person will we set up at the beginning of last year. Michael — what do you have in place?"},
    {"speaker": "client",  "text": "Absolutely nothing. I'm embarrassed. My Adobe 401K beneficiary is almost certainly still my parents from when I enrolled at thirty-one."},
    {"speaker": "client",  "text": "I had nothing either when I first came in. You're in good company."},
    {"speaker": "advisor", "text": "I'll set up a joint session with the estate attorney this month. As an engaged couple planning to marry this year, you need wills that name each other as primary beneficiaries, healthcare proxies for each other, and all retirement account designations updated. Michael — changing that 401K beneficiary is urgently overdue. I'll flag it as action item number one."},
    {"speaker": "client",  "text": "Consider it done. Between Sarah and this conversation, I've run out of excuses."},
]

# ---------------------------------------------------------------------------
# MEETING 5  —  Annual Review  (Sarah & Michael, 18 months in)
# Date: June 2025 (~18 months after onboarding, ~3 months after engagement)
# Meeting type: annual_review
# Context: First formal annual review.  Portfolio has grown significantly.
#   Michael's accounts are now partially integrated into the managed platform.
#   Concentration has dropped from 70% -> 38% company stock.  FIRE timeline
#   is slightly ahead of original projections.  Sarah is contemplating leaving
#   BigTech for a Series-B AI startup.  Charitable giving discussion.
#   Sentiment: confident, forward-looking; Michael increasingly engaged.
# ---------------------------------------------------------------------------
SARAH_CHEN_M5_ANNUAL_REVIEW = [
    {"speaker": "advisor", "text": "Sarah, Michael — welcome to your first formal annual review. I'll say upfront: I'm pleased with these numbers and I think you will be too. Let's get into it."},
    {"speaker": "client",  "text": "I peeked at the portal a few days ago and things looked good, but I want the full picture."},
    {"speaker": "client",  "text": "Sarah made me download the app three months ago. I'm checking it more than my Adobe stock ticker now, which probably says something."},
    {"speaker": "advisor", "text": "Let me start with the portfolio headline. Combined, you're at one point four seven million in invested assets as of Friday's close. Sarah — you started at eight hundred fifty thousand when we first met eighteen months ago. Your individual portfolio today is one point two eight million. That is a fifty-one percent total increase including all RSU contributions."},
    {"speaker": "client",  "text": "Fifty-one percent — and my company stock definitely did not go up fifty-one percent. So the diversification and systematic investing genuinely moved the needle."},
    {"speaker": "advisor", "text": "Here's the concentration scorecard you've been watching. Your single-stock company exposure at our first meeting was seventy percent of your net worth. Today it's thirty-eight percent. Original target was thirty percent by eighteen months — we're close, and we stay on plan. By December after the next scheduled vest-and-sell, we'll be at or below thirty."},
    {"speaker": "client",  "text": "Thirty-eight to thirty — I still remember sitting across from you feeling trapped at seventy. That number is one of the most satisfying things I've seen in a while."},
    {"speaker": "advisor", "text": "Performance attribution: the managed portfolio returned fourteen point two percent year over year versus the benchmark at eleven point eight. That two hundred forty basis point outperformance came primarily from two things: the rebalancing buys we executed during the September 2024 correction, and the systematic tax harvesting program. Over the full eighteen months, the tax optimization has generated thirty-four thousand dollars in after-tax value."},
    {"speaker": "client",  "text": "So the September panic meeting actually produced thirty-four thousand dollars in value. That is a remarkably good return on an anxiety attack."},
    {"speaker": "client",  "text": "I heard about that panic meeting. I'm glad I'm getting the full experience now rather than going through something similar alone."},
    {"speaker": "advisor", "text": "FIRE progress update. Using your combined savings rate of two hundred eighty-five thousand annually — which frankly is exceptional for a couple in their mid-thirties — the current model projects Sarah hitting her FIRE number at forty-four point six years. That's roughly five months ahead of the original solo projection."},
    {"speaker": "client",  "text": "Wait — ahead of schedule? Even after the September dip?"},
    {"speaker": "advisor", "text": "Ahead of schedule because of three things that weren't in the original model: the promotion you received in September, Michael's income joining the household savings rate, and the RSU grant values coming in higher than projected in Q1 this year."},
    {"speaker": "client",  "text": "When you put it that way — Michael, we might be able to retire at the same time even though you're two years behind me in the timeline."},
    {"speaker": "client",  "text": "That is genuinely the first retirement math that has excited me rather than scared me."},
    {"speaker": "advisor", "text": "I want to discuss a topic you raised in our March meeting, Sarah, because it has significant financial implications. You mentioned you've been having exploratory conversations with founders of a Series B AI infrastructure company and considering leaving BigTech. Has that decision evolved?"},
    {"speaker": "client",  "text": "It has. I've met with them three more times. The opportunity is real — it's not a fantasy. They want me to lead the infrastructure team. But the comp cut in years one and two would be significant, and I'd be leaving RSUs on the table."},
    {"speaker": "advisor", "text": "Let me give you the number on the table. If you leave before your December cliff vest, you'd forfeit approximately one hundred ninety thousand dollars in unvested RSUs. If you wait until January — one month past the vest — you keep all of it. The timing question alone is worth two to three months of patience."},
    {"speaker": "client",  "text": "I know. I've told them if it happens, it happens after December. They've agreed to hold the offer."},
    {"speaker": "advisor", "text": "Good discipline. Now if you do leave, several things change in the financial plan: income drops for two to three years, which creates a gap in the FIRE savings rate; you'd roll your BigTech 401K into an IRA; and through the startup entity you could establish a Solo 401K with much higher contribution limits. I want to model both trajectories — stay at BigTech versus startup — so you can make this decision with full financial visibility. I'll have that comparison ready for you by mid-July."},
    {"speaker": "client",  "text": "That's exactly what I need. I want to make this decision with eyes open, not with gut instinct alone."},
    {"speaker": "client",  "text": "I told her she should get that model before doing anything. I'm glad you're building it."},
    {"speaker": "advisor", "text": "One more topic for today — charitable giving. Sarah, you mentioned earlier this year that losing your grandmother prompted you to want to give more meaningfully. At your combined income level, a Donor-Advised Fund makes excellent sense. You could contribute fifty thousand in appreciated stock this year, receive the full deduction in the current tax year, and grant it out to causes over the next several years at your discretion."},
    {"speaker": "client",  "text": "I've been thinking about this a lot. My grandmother loved her local library and I'd like to make a gift in her memory. The DAF structure would let me do that over time rather than all at once, correct?"},
    {"speaker": "advisor", "text": "Exactly. You fund the DAF now, take the deduction, and you have complete flexibility on when and to whom you grant the funds. You can even name it something meaningful — the Chen Family Fund, for instance — and it becomes a philanthropic identity separate from your taxes."},
    {"speaker": "client",  "text": "The Chen Family Fund. I like that. Let's do it. How do we start?"},
    {"speaker": "advisor", "text": "I'll send you the Fidelity Charitable paperwork this week. Contribute appreciated company stock rather than cash — you avoid the capital gain entirely and still get the full market value deduction. I'll coordinate with the accountant to maximize the timing against this year's estimated taxes. This is a genuinely good year to do it."},
]

# ---------------------------------------------------------------------------
# MEETING 6  —  Major Life Event: Baby on the Way
# Date: January 2026 (~24 months after onboarding)
# Meeting type: planning
# Context: Sarah is 12 weeks pregnant, due July 2026.  Major financial
#   decisions: 529 account setup, life insurance upgrade to $2.5M/$2M,
#   will rewrite with guardian designation, FIRE timeline reframe to age 50,
#   home purchase plan (East Bay, ~$1M), childcare budget shock in SF,
#   emergency fund expansion to 9-12 months, and Sarah decides to stay
#   at BigTech through the parental leave and December RSU cliff.
#   Sentiment: joyful, newly serious, grounded — "building something" energy.
# ---------------------------------------------------------------------------
SARAH_CHEN_M6_EXPECTING = [
    {"speaker": "advisor", "text": "Sarah, Michael — you're both smiling like you have news. I'm going to guess this is not a routine check-in."},
    {"speaker": "client",  "text": "We're expecting. I'm twelve weeks along, due date is July fourteenth. We wanted you to be one of the first people we told outside of family."},
    {"speaker": "client",  "text": "A baby. Which means the financial plan is about to get interesting."},
    {"speaker": "advisor", "text": "Congratulations to you both — this is genuinely wonderful news. And you're right, Michael, it does get interesting. The good news is that the two years of planning work we've done together is precisely the foundation you want under you for this kind of change. Let me make sure I understand the timeline — July means about six months from today."},
    {"speaker": "client",  "text": "Yes, six months. We've started thinking through what this means financially, and honestly, even with all the planning we've done, the childcare cost estimates for San Francisco were a shock."},
    {"speaker": "advisor", "text": "Let's address that directly and early. Quality infant daycare in San Francisco ranges from thirty-two hundred to forty-eight hundred dollars a month. Budgeting thirty-five hundred to be conservative, you're looking at forty-two thousand dollars per year in after-tax childcare expenses — more than the annual tuition at many private universities. That is the single largest new line item entering your budget."},
    {"speaker": "client",  "text": "Forty-two thousand a year. I knew it was expensive but hearing you say that number out loud is still a gut punch."},
    {"speaker": "client",  "text": "We've been telling ourselves it's manageable, but that's real money in a real budget."},
    {"speaker": "advisor", "text": "It is. And we'll rebuild the budget model around it. Sarah, let's talk about your parental leave — what does your employer offer?"},
    {"speaker": "client",  "text": "Twenty weeks fully paid at full salary. On top of that, California's state disability and bonding program adds six weeks, so I can realistically take twenty-six weeks. I'm thinking twenty weeks paid for certain, then eight additional weeks unpaid, which gets me to about seven months total leave."},
    {"speaker": "advisor", "text": "That is a strong parental leave package. The financial impact of the eight weeks unpaid, at your salary, is roughly forty-seven thousand dollars in gross income — substantial, but manageable given your savings rate. Michael, what does Adobe provide?"},
    {"speaker": "client",  "text": "Six weeks fully paid for partners. I'm taking every single day of it. That was decided before this meeting."},
    {"speaker": "advisor", "text": "Good. Now the question that I know is on your mind, Sarah — what does this do to the FIRE timeline?"},
    {"speaker": "client",  "text": "I want to be completely honest with you: I've been thinking about this since we found out, and I've shifted. I don't feel the urgency to retire at forty-five that I used to feel. Having a child changed what retirement means to me. I want to retire when our child is old enough to actually experience the world with us — to remember trips, to be present with us in the way that matters. That's a different goal than financial independence as fast as possible."},
    {"speaker": "advisor", "text": "That is a profound and healthy evolution in your goal-setting, and I want to honor it rather than override it. Let me reframe the target. Instead of a fixed age, we're now targeting a specific portfolio number — six point five million — which comfortably supports a family of three in retirement without compromising on lifestyle. Based on current projections, you hit that number at approximately age fifty for Sarah. That's thirteen years from today."},
    {"speaker": "client",  "text": "Fifty sounds right. Retiring before most people's kids go to college — we'd be present for all of those years rather than still grinding."},
    {"speaker": "client",  "text": "I'm very comfortable with fifty. That's still a remarkable outcome."},
    {"speaker": "advisor", "text": "Let's get a 529 account set up right now — even before the baby arrives. California's ScholarShare plan has excellent low-cost index fund options. If you contribute fifty thousand dollars this month and then add twelve thousand per year going forward, we're projecting approximately two hundred eighty thousand at college age assuming seven percent annual growth. That fully funds four years of private university today's cost with breathing room."},
    {"speaker": "client",  "text": "Let's open it today if we can. Fund it from the joint account — we've been building that specifically for shared goals like this."},
    {"speaker": "client",  "text": "Agreed. I want that account open before we leave this office."},
    {"speaker": "advisor", "text": "I'll pull up the paperwork now. While we do that, I need to address life insurance urgently. Sarah, you have a one million dollar twenty-year term policy we set up at the start of our relationship. That number was appropriate for a single person with no dependents. It is not appropriate for someone who will be the primary breadwinner for a family. I'm recommending two point five million for you and two million for Michael. The combined annual premium will run approximately twenty-eight hundred to thirty-two hundred dollars a year."},
    {"speaker": "client",  "text": "Whatever the number needs to be. This is not a line item I'm going to debate. Upgrade it."},
    {"speaker": "client",  "text": "Same. No debate from me either."},
    {"speaker": "advisor", "text": "Done. And the wills need a complete rewrite this month — not this quarter, this month. Sarah, your current will was written for a single person with no dependents. Michael, yours was written as a single person. Both need to be rewritten to designate each other as primary beneficiaries, establish a testamentary trust for your child, and critically — name guardians. Have you had those conversations with family?"},
    {"speaker": "client",  "text": "Yes. My sister and her husband have agreed to be guardians. We asked them over the holidays and they said yes immediately."},
    {"speaker": "client",  "text": "My brother is our backup. We've had these conversations and we're ready to put it in writing."},
    {"speaker": "advisor", "text": "You are ahead of most clients on the emotional side of this — most people avoid the guardian conversation. I'll coordinate with the estate attorney to draft both wills, establish the trust structure, and update all beneficiary designations on every account we hold. This will be completed before your second trimester ends."},
    {"speaker": "client",  "text": "There's one more thing I want to tell you. I've made my decision about the startup. I'm staying at BigTech. The parental leave package, the December RSU cliff, the health insurance coverage for a new baby — I can't rationally walk away from all of that right now. Maybe when the baby is two or three. But not now."},
    {"speaker": "advisor", "text": "That is the right financial decision for this phase of your life, and I think you know it. The December vest alone is worth keeping the status quo. And staying means you'll go through the entire parental leave fully paid, which is an extraordinary benefit."},
    {"speaker": "client",  "text": "We also want to buy a home. Renting with a newborn in an apartment that wasn't designed for it doesn't feel right. We've been looking at the East Bay — Oakland and Piedmont — where a good two-bedroom is nine hundred thousand to one point one million, and the commute into SF is manageable on BART."},
    {"speaker": "advisor", "text": "The East Bay move makes strategic sense — more space, better value per dollar, and access to city income without city property prices. What down payment are you thinking?"},
    {"speaker": "client",  "text": "Twenty percent on a one-million-dollar property — so two hundred thousand. We can take that from the joint account without touching either of our individual invested portfolios."},
    {"speaker": "advisor", "text": "The math works and the structure is right — keep the invested portfolios untouched and use the joint savings bucket for the down payment. A few things to plan carefully: rates are easing slightly compared to last year, so the timing has improved. And with a child and a mortgage simultaneously, your emergency fund needs to expand from six months to nine to twelve months of expenses. That's approximately one hundred fifty to two hundred thousand in liquid savings outside of the down payment. We need to build that buffer over the next three months."},
    {"speaker": "client",  "text": "That's a lot of cash to hold — emergency fund plus down payment is almost three hundred fifty thousand outside the portfolio. That feels uncomfortably large."},
    {"speaker": "advisor", "text": "It is a larger cash position than you're used to holding. But you are simultaneously buying a house, having a baby, and taking partial unpaid leave in the same twelve-month window. This is the one time in your life where being over-liquid is the correct choice. The portfolio continues compounding. The cash is your buffer against the unexpected."},
    {"speaker": "client",  "text": "When you lay it out that way — we're doing all the major things at once. House, baby, leave. It makes sense to hold more cash."},
    {"speaker": "advisor", "text": "Sarah, can I step back for a moment? You came into this office two years ago with eight hundred fifty thousand dollars, a seventy percent concentration in one stock, no will, no life insurance, and no plan. Today you're at one point five million in managed assets, thirty-eight percent concentration and falling, fully insured, wills on their way, a partner with an integrated financial plan, a donor-advised fund, a 529 account we're opening right now, a home purchase strategy, and a baby due in July. This is what the work is for."},
    {"speaker": "client",  "text": "I still remember that first meeting — I was so embarrassed about how little I'd done with everything I'd earned. Now it all feels settled. Even with everything changing at once, I feel like we have a structure that can handle it."},
    {"speaker": "client",  "text": "I came in skeptical of financial planning. I was wrong. What you two have built here is genuinely impressive."},
    {"speaker": "advisor", "text": "You both did the work. I'll get the 529 paperwork started, coordinate the insurance upgrade, and have the estate attorney reach out this week. I want to schedule a check-in in April — six weeks before the due date — just to make sure the home purchase and all the protective scaffolding is in place before July. Deal?"},
    {"speaker": "client",  "text": "Deal. April it is. And thank you — for all of it."},
]
