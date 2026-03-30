"""
Jennifer Reyes — Multi-Meeting Journey (Meetings 2 through 6)

Building on the initial prospecting meeting (JENNIFER_REYES in profiles.py),
this module captures Jennifer's journey from financial anxiety to earned
confidence as she rebuilds her life and financial independence post-divorce:

  M2  Onboarding / Getting Invested         Jan 2024  — 3 weeks after M1
  M3  Career Pivot Opportunity              Aug 2024  — private practice offer
  M4  Emma's College Crunch                 Oct 2025  — applications, FAFSA reality
  M5  Annual Review                         Apr 2025  — 15-month check-in, home settled
  M6  A New Chapter                         Jan 2026  — serious relationship, beneficiary review

Key themes:
  - Rebuilding financial identity after being the "non-financial" spouse
  - Understanding fees and fiduciary duty — trust was broken, must be re-earned
  - The emotional weight of paying for two college educations alone
  - Career growth restoring confidence alongside portfolio growth
  - Learning to plan for a future that now feels open rather than frightening
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# MEETING 2  —  Onboarding / Getting Everything Invested
# Date: mid-January 2024 (~3 weeks after M1)
# Meeting type: onboarding
# Context: Jennifer has been sitting on $1.1M in cash for months. Time to
#   act. Advisor presents the full investment plan, 529 accounts for Emma
#   and Liam, $1M 20-year term life insurance, new will referral, and the
#   home purchase pre-planning. Jennifer is attentive and asks detailed
#   questions — she is done trusting blindly.
#   Sentiment: cautious engagement, punctuated by real questions on fees.
# ---------------------------------------------------------------------------
REYES_M2_ONBOARDING = [
    {"speaker": "advisor", "text": "Jennifer, welcome back. Three weeks ago you said you had been in cash for over six months and it was time to move. I have a full plan ready. But first — you mentioned questions. What's at the top of your list?"},
    {"speaker": "client",  "text": "Fees. You said you were fee-only and fiduciary, and I want to understand exactly how you get paid before I move a dollar."},
    {"speaker": "advisor", "text": "I respect that completely and I'm going to answer it fully. I charge a flat fee of five thousand dollars per year for clients under two million dollars in assets — that's what you'll receive. No commissions, no referral fees, no percentage of transactions. If I recommend a product that pays a commission, I will tell you and I will show you an alternative that doesn't. Your fee is the same whether your portfolio goes up or down. I'm on your side."},
    {"speaker": "client",  "text": "My previous advisor charged two point one percent annually, which I found out much later. On a million-dollar portfolio that's twenty-one thousand dollars a year. I had no idea."},
    {"speaker": "advisor", "text": "At two point one percent on a million dollars compounded over ten years, you would have paid approximately two hundred sixty thousand dollars in fees — more than the cost of one child's college education. You had every right to be angry. My fee for the same period at five thousand per year is fifty thousand dollars. The difference matters enormously over time."},
    {"speaker": "client",  "text": "Okay. I've verified your registration and I've checked the fiduciary commitment in writing. I'm ready. Let's get the money working."},
    {"speaker": "advisor", "text": "Here's the investment plan. Your total investable assets are one million one hundred thousand. I'm splitting them into four buckets. Bucket one: one hundred fifty thousand in a high-yield savings account as your emergency fund — six months of expenses plus a temporary home purchase fund. Bucket two: your IRA rollover of four hundred twenty thousand, invested in a target-date fund appropriate for a sixty-two year old retirement date. Bucket three: four hundred thousand in a diversified taxable managed account — sixty percent global equities, thirty percent fixed income, ten percent real estate investment trusts. Bucket four: one hundred twenty thousand reserved for the home purchase within twelve to eighteen months."},
    {"speaker": "client",  "text": "That's clean. I like the buckets. The one hundred twenty thousand for the home purchase — we talked about a four-hundred-fifty-thousand-dollar house with a hundred-fifty-thousand down payment. Why only one-twenty?"},
    {"speaker": "advisor", "text": "Good catch. The remaining thirty thousand will accumulate through your savings rate over the next twelve months. You're earning seventy-eight thousand and your expenses net of rent are currently modest. I'm projecting you save approximately thirty-eight thousand this year on top of retirement contributions. That brings the home fund to one hundred fifty by the time you want to buy."},
    {"speaker": "client",  "text": "That actually works. I hadn't done that math that way. Let's talk about the kids' 529 accounts — that's the thing that wakes me up at three in the morning."},
    {"speaker": "advisor", "text": "Emma is fifteen and applying to college in three years. Liam is thirteen. Funding Emma's account now is urgent. I'm recommending opening both accounts immediately and making these initial contributions: twenty-five thousand into Emma's account given the short timeline and time is running out, and fifteen thousand into Liam's account with five more years of runway. These go into age-based glide paths that automatically become more conservative as each enrollment date approaches."},
    {"speaker": "client",  "text": "Twenty-five thousand for Emma and fifteen for Liam. Can I afford that while also putting enough in the home fund and investing for my own retirement?"},
    {"speaker": "advisor", "text": "Yes — and here's why it pencils. The two hundred forty thousand sitting in your IRA covers your retirement. The taxable account at four hundred thousand grows for your financial independence. The 529 amounts come from a small portion of the emergency fund I intentionally oversized by forty thousand specifically to give you this immediate flexibility. The math is built for this."},
    {"speaker": "client",  "text": "You planned this before I even asked. Okay. Yes to both 529 accounts."},
    {"speaker": "advisor", "text": "Life insurance. Jennifer, you are the sole provider for Emma and Liam. If something happens to you, they need financial security. I'm recommending a one-million-dollar twenty-year term policy. At forty-two in good health, the monthly premium is approximately forty-one dollars."},
    {"speaker": "client",  "text": "Forty-one dollars. And my ex-husband lost his policy when we divorced, so the kids have no coverage at all. Yes — apply for it today. I should have done this before now."},
    {"speaker": "advisor", "text": "I'll send you the application this afternoon. And estate documents — new will, healthcare proxy, guardian designation for Emma and Liam. Who would be their guardian if something happened?"},
    {"speaker": "client",  "text": "My sister Maria in Phoenix. We've already talked about it. She's agreed. I just need the document to reflect it."},
    {"speaker": "advisor", "text": "Send me Maria's full name and I'll include that in the referral to the estate attorney this week. Jennifer — you came in six months ago with this money frozen because you didn't trust yourself to make the right decisions. Today you're making every right decision. You should trust yourself."},
    {"speaker": "client",  "text": "The difference is I'm making them with someone who is actually explaining them to me rather than just telling me what to do."},
]

# ---------------------------------------------------------------------------
# MEETING 3  —  Career Pivot Opportunity
# Date: August 2024 (~7 months after onboarding)
# Meeting type: planning
# Context: Jennifer has been offered a position at a private occupational
#   therapy practice at $115K — a 47% salary increase from $78K. However,
#   the new role loses hospital benefits: employer 401k match, union
#   pension accrual, and comprehensive health insurance. Liam has a medical
#   condition (controlled asthma) requiring regular specialist visits.
#   Sentiment: excited but worried about the health insurance gap.
# ---------------------------------------------------------------------------
REYES_M3_CAREER_PIVOT = [
    {"speaker": "advisor", "text": "Jennifer — you sounded excited on the phone. Tell me what happened."},
    {"speaker": "client",  "text": "I've been offered a position at a private occupational therapy practice. The pay is one hundred fifteen thousand dollars — that's thirty-seven thousand more than I'm making at the hospital. It's also closer to home, better hours, and honestly the work is more rewarding. But I'm terrified about what I'm giving up."},
    {"speaker": "advisor", "text": "Let's go through what you're giving up specifically, because the gross salary increase can be very misleading. What benefits does the hospital currently provide?"},
    {"speaker": "client",  "text": "Full health insurance — I pay about two hundred twenty dollars per month and it covers me and both kids. Three percent 401k match on the first six percent I contribute. And I'm six years into a fourteen-year vesting cliff for a small pension. If I leave now, I lose the pension entirely."},
    {"speaker": "advisor", "text": "The pension vesting is the most significant hidden cost. What is the estimated pension benefit at fourteen years vested, and what would the present value be?"},
    {"speaker": "client",  "text": "HR gave me a statement last year. At full vesting with my current salary trajectory, the estimated benefit was around seven hundred dollars a month starting at sixty-two. I've gotten six years of seven hundred dollars a month annuity that I'm walking away from."},
    {"speaker": "advisor", "text": "Let me put a present value on that. Seven hundred dollars per month for twenty years starting at sixty-two — that's a present lump sum value of approximately ninety thousand to one hundred ten thousand dollars depending on discount rate. That is real money you are leaving on the table. However — and this matters — you have eight more years to qualify. If you stayed another eight years earning forty-five thousand dollars more per year at the new job, the additional income over that period is three hundred sixty thousand dollars. That more than compensates for the pension loss, assuming you invest the difference."},
    {"speaker": "client",  "text": "So the pension loss is material but the salary difference wins over the long run."},
    {"speaker": "advisor", "text": "Over the long run, yes. The question is whether the short-run transition works. Health insurance — the new practice offers a group plan?"},
    {"speaker": "client",  "text": "Yes, but it's not as comprehensive. The premium for me and both kids would be six hundred twenty dollars per month versus my current two hundred twenty. That's four hundred dollars more per month, or forty-eight hundred a year."},
    {"speaker": "advisor", "text": "Before we do the net calculation — Liam's asthma. The specialist visits and the maintenance inhaler — what does that look like annually on your current plan?"},
    {"speaker": "client",  "text": "About six to eight specialist visits a year at thirty dollars co-pay each, plus the inhaler at twenty a month. Very affordable right now. I need to check the new plan's specialist co-pay and prescription coverage carefully."},
    {"speaker": "advisor", "text": "That review is non-negotiable before you accept. Request the Summary of Benefits and Coverage document from the new practice today. Have your current state medicine specialist — or Liam's pediatrician — confirm whether they're in-network. If there is any gap in Liam's coverage, the true cost of switching could be much higher than the four-hundred-dollar premium difference."},
    {"speaker": "client",  "text": "I called Liam's pulmonologist this morning. He checked — he is in-network on the new plan. The specialist co-pay is sixty dollars instead of thirty, but the maintenance inhaler is the same tier. So I'm looking at maybe three hundred extra per year in Liam's care costs."},
    {"speaker": "advisor", "text": "Good research, Jennifer. Let's do the net math. Salary increase: thirty-seven thousand. Additional health premium: minus forty-eight hundred. Additional Liam care: minus three hundred. Net benefit of the new job versus the hospital: approximately thirty-two thousand per year, before retirement savings treatment."},
    {"speaker": "client",  "text": "Thirty-two thousand more per year is genuinely life-changing for us. That's more than forty percent of what I used to make total."},
    {"speaker": "advisor", "text": "The private practice likely doesn't offer a 401k match — does it?"},
    {"speaker": "client",  "text": "No match. But they have a SIMPLE IRA I can contribute to."},
    {"speaker": "advisor", "text": "If they offer a SIMPLE IRA, you can contribute sixteen thousand per year — that's actually less than the hospital 401k limit of twenty-three thousand. However, you now have a SEP-IRA option since you're joining a smaller practice and depending on ownership structure. I'll need to review what type of entity the practice is. If appropriate, a SEP-IRA would allow contributions up to sixty-six thousand dollars — extraordinarily powerful at your income level."},
    {"speaker": "client",  "text": "Sixty-six thousand per year in a SEP-IRA? That would be transformational for my retirement catch-up."},
    {"speaker": "advisor", "text": "If the setup supports it, yes. This might actually turn a good career move into an exceptional financial planning decision. Take the job, Jennifer. The numbers support it, the personal fit sounds right, and the professional growth matters."},
    {"speaker": "client",  "text": "I've been hoping you'd say that. I'm going to call them this afternoon."},
]

# ---------------------------------------------------------------------------
# MEETING 4  —  Emma's College Crunch
# Date: October 2025 (~21 months after onboarding)
# Meeting type: planning
# Context: Emma is now 17 and actively applying to colleges — large state
#   university (relatively affordable), two smaller liberal arts schools
#   (expensive), and one reach school. FAFSA is filed. Jennifer's income
#   has grown to $118K and the asset base has grown — but FAFSA treats
#   both favorably and unfavorably in ways Jennifer didn't anticipate.
#   529 balance is not enough for an expensive private school scenario.
#   Sentiment: realistic financial tension, but much more equipped than M1.
# ---------------------------------------------------------------------------
REYES_M4_EMMA_COLLEGE = [
    {"speaker": "advisor", "text": "Jennifer — Emma's applications are in, FAFSA is filed. How are you feeling about the financial side of this?"},
    {"speaker": "client",  "text": "Honestly, the FAFSA results were a rude awakening. I expected more help given that I'm a single parent. The Expected Family Contribution came out much higher than I thought it would be."},
    {"speaker": "advisor", "text": "Walk me through the FAFSA outcome and I'll help you interpret it."},
    {"speaker": "client",  "text": "Our Student Aid Index — they renamed it from EFC — came out at eighteen thousand. That means the schools calculate my expected contribution at eighteen thousand per year. The state university costs thirty-two thousand all-in, so the gap they need to fill with grant and loan is fourteen thousand. Fine. But the private liberal arts schools cost sixty-five to seventy thousand per year. The SAI of eighteen thousand means I'm expected to cover eighteen thousand out of pocket, and the school fills the rest with a mix of grant and loan. The question is how much grant versus how much loan."},
    {"speaker": "advisor", "text": "That's the critical variable. The private school's financial aid generosity determines everything. Did you file for the CSS Profile in addition to the FAFSA for the private schools?"},
    {"speaker": "client",  "text": "Yes, both. One of the liberal arts schools told me during a campus tour that they meet one hundred percent of demonstrated need. If their calculated need is fifty thousand per year and they meet one hundred percent of it, that's better than the state school if Emma gets significant merit as well."},
    {"speaker": "advisor", "text": "That's the right analysis. 'Meeting full need' schools are dramatically different from schools that only partially meet need. For Emma's shortlist, let's look at each school's average packaging. I can pull data on what percentage of need they meet with grants versus loans versus work-study."},
    {"speaker": "client",  "text": "I want to understand the 529 situation. We have forty-three thousand in Emma's account. If she goes to the expensive private school, that covers less than one year."},
    {"speaker": "advisor", "text": "Forty-three thousand over four years is approximately eleven thousand per year of supplemental coverage. For the state school at thirty-two thousand with about fourteen thousand in aid, you'd need roughly eighteen thousand per year — between the 529 distribution, your income, and possibly a small Parent PLUS loan. For the expensive private school, much depends on the aid package. I want to model three scenarios: state school, meet-full-need liberal arts, and worst-case private with minimal aid."},
    {"speaker": "client",  "text": "The worst case scenario is what keeps me up at night. If Emma goes to an expensive school with inadequate aid, am I looking at sixty thousand per year out of pocket?"},
    {"speaker": "advisor", "text": "In the worst case — expensive school, poor aid package — you'd face a gap of thirty-five to forty-five thousand per year after the 529 distribution and standard aid. Over four years that's one hundred forty to one hundred eighty thousand in additional borrowing or cash. That would significantly impact both your retirement trajectory and your resources for Liam's education in two years."},
    {"speaker": "client",  "text": "So the 'dream school at any cost' conversation needs to be honest with Emma."},
    {"speaker": "advisor", "text": "It does. And I want to give you a framework for that conversation. I call it the net cost comparison — once all offers are in, we compare each school's actual four-year cost after all aid, and we discuss it the same way we'd discuss any other major financial decision. A school that meets full need might genuinely cost less than the state school after a merit scholarship. The sticker price comparison is misleading. We look at the net cost."},
    {"speaker": "client",  "text": "That's a much more useful frame. Emma is smart — she can handle an honest financial conversation. I don't want to put her in a situation where she's starting life with two hundred thousand in debt."},
    {"speaker": "advisor", "text": "The incoming Class of 2025 at the schools that fully meet need will actually likely show Emma with relatively modest borrowing — fifteen to twenty-five thousand total if she qualifies for substantial grant aid. I'd also encourage looking at merit scholarships actively. Emma's grades and her story as a daughter of an OT who overcame adversity — that resonates strongly in scholarship applications at mid-tier schools."},
    {"speaker": "client",  "text": "Her guidance counselor said the same thing. She's applying for at least four merit scholarships separately from the institutional aid."},
    {"speaker": "advisor", "text": "Good. Jennifer, you came to me two years ago saying your only coherent thought was 'I can't let my kids down on college.' You have forty-three thousand in Emma's account, a growing income, a managed portfolio, and a sensible framework for making the college decision. You have not let her down."},
    {"speaker": "client",  "text": "Some days I still feel like I'm making it up as I go along."},
    {"speaker": "advisor", "text": "All parents do. The difference is you have a plan underneath the improvisation."},
]

# ---------------------------------------------------------------------------
# MEETING 5  —  Annual Review  (15 months in, settled into new career)
# Date: April 2025 (~15 months after onboarding)
# Meeting type: annual_review
# Context: Jennifer has been in her new job 8 months ($115K → $118K for
#   first raise). Home purchase closed in July 2024 — a $420K townhouse in
#   Portland with $150K down. Portfolio is performing. Liam is focused on
#   competitive swimming (expensive but manageable). 529 for Emma growing.
#   Sentiment: grounded confidence; Jennifer is genuinely different from M1.
# ---------------------------------------------------------------------------
REYES_M5_ANNUAL_REVIEW = [
    {"speaker": "advisor", "text": "Jennifer — fifteen months. I want to start by just acknowledging how much has happened. New job. New home. Two kids thriving. You should be proud of what you've built in this window."},
    {"speaker": "client",  "text": "It doesn't always feel like progress from the inside. But looking at the spreadsheet you send versus what I had two years ago — you're right. Things are genuinely different."},
    {"speaker": "advisor", "text": "Let's look at the numbers. Your total investable portfolio today is one point zero three million dollars, up from your starting one point one million net of the home down payment of one hundred fifty thousand. So you're actually flatly ahead when you account for the hundred fifty thousand you spent on the house."},
    {"speaker": "client",  "text": "I keep forgetting the home equity is part of the picture. The house is worth about four hundred fifty thousand — what I paid for it — and the mortgage balance is two hundred seventy thousand. So I have one hundred eighty thousand in home equity on top of the one million in investments."},
    {"speaker": "advisor", "text": "Total net worth today: approximately one point two million. That is a meaningful increase from your starting point, incorporating both the investment returns and the home equity build. More importantly — your income is now one hundred eighteen thousand at the private practice, versus seventy-eight thousand two years ago. That forty-thousand-dollar income increase is flowing into savings. Your annual savings rate this year was sixty-two thousand dollars — across retirement accounts, taxable savings, and 529 contributions."},
    {"speaker": "client",  "text": "Sixty-two thousand in savings on a hundred eighteen thousand income. That's over fifty percent of my take-home. Is that actually right?"},
    {"speaker": "advisor", "text": "It is. Strong retirement contributions, modest but disciplined lifestyle, no high-interest debt. You're building real wealth now. The twenty-year projection with this savings rate shows you at approximately three million in real assets by retirement at sixty-two — enough to generate ninety to one hundred thousand per year in sustainable income."},
    {"speaker": "client",  "text": "That seems almost impossible from where I started, but I believe it now. Can we talk about Liam's swimming? He's made the club team and the annual cost is six thousand dollars between equipment, travel, and meet fees. I want to make sure that's planned for."},
    {"speaker": "advisor", "text": "Six thousand per year for an activity that keeps a teenage boy engaged, competitive, healthy, and supervised is one of the best investments you'll make. I'm adding it to your annual expense model as a line item. It's well within budget at your income. Does he love it?"},
    {"speaker": "client",  "text": "He loves it so much he's become a different kid. Focused, motivated, sleeping well. His grades are better. Whatever it costs, it's worth it."},
    {"speaker": "advisor", "text": "Then it belongs in the plan. Now — the 529 situation. Emma's account is at forty-three thousand. Liam's is at twenty-three thousand with five years until college. I want to increase both annual contributions. What can you do above what you're currently putting in?"},
    {"speaker": "client",  "text": "I put five thousand a year into each. Could I do eight thousand for Emma given the timeline pressure?"},
    {"speaker": "advisor", "text": "Do eight thousand for Emma for the next three years — that adds twenty-four thousand plus growth to get to approximately sixty-six thousand at enrollment. Enough to cover roughly half a year of an expensive private school, or almost two full years at the state school. It meaningfully changes the scenario options. Keep Liam at five thousand per year for now and increase when Emma's tuition becomes a known expense."},
    {"speaker": "client",  "text": "One thing I've been thinking about. My previous advisor charged fees that I didn't understand. I now understand every fee in this relationship and I review it actively. I want to say — this has been genuinely different from my prior experience."},
    {"speaker": "advisor", "text": "Jennifer, that meant a lot to hear. You earned this progress. The plan works because you follow it. Let's keep going."},
]

# ---------------------------------------------------------------------------
# MEETING 6  —  A New Chapter
# Date: January 2026 (~24 months after onboarding)
# Meeting type: planning
# Context: Jennifer has been dating David Kim seriously for 7 months.
#   They're not living together but conversations have become serious.
#   He is a public school principal, age 44, financially stable but not
#   wealthy. Jennifer wants professional guidance on how to think about
#   financial co-mingling — or not. Beneficiary updates. Emma has been
#   accepted to her top-choice school with a strong aid package.
#   Sentiment: cautiously hopeful; more emotionally open than any prior
#   meeting. Jennifer now advocates for herself with confidence.
# ---------------------------------------------------------------------------
REYES_M6_NEW_RELATIONSHIP = [
    {"speaker": "advisor", "text": "Jennifer — you said there were two things you wanted to discuss today. One financial, one personal that has financial implications."},
    {"speaker": "client",  "text": "Let me start with the good news first. Emma got into her top-choice school — the liberal arts college that meets full demonstrated need. The financial aid offer came last week. Full need met, twenty-eight thousand in grants and three thousand in federal subsidized loans per year. Her total out-of-pocket cost to me is about fourteen thousand per year. Four years total: fifty-six thousand dollars."},
    {"speaker": "advisor", "text": "Jennifer — that is a remarkable outcome. You had Emma's 529 at sixty-six thousand. Emma is fully funded for college, with ten thousand to spare toward graduate school contributions or transfer to Liam's 529. The stress of the last two years on this topic resolves right here."},
    {"speaker": "client",  "text": "I cried when the offer came. Ugly cried. Because two years ago I walked into this office terrified that I couldn't do this for my kids. And we did it."},
    {"speaker": "advisor", "text": "You did it. Now — the second topic."},
    {"speaker": "client",  "text": "I've been seeing someone seriously for seven months. His name is David Kim. He's a principal at an elementary school in Lake Oswego. Good man. Financially stable — he has a public pension, an Oregon retirement account, and a paid-off car loan. Not wealthy, but responsible. We've started having conversations about the future and I want to think out loud about the financial architecture of a potential shared life."},
    {"speaker": "advisor", "text": "That's a wise and healthy instinct — to think about this clearly now rather than reactively later. Let me ask a few questions. Are you thinking about marriage, or is this earlier than that?"},
    {"speaker": "client",  "text": "Earlier in the conversation, but not speculative. I want to be prepared this time. Last time I never had my own financial understanding and it cost me enormously in the divorce. I will not do that again."},
    {"speaker": "advisor", "text": "The most important financial protection you have is your own financial literacy and your own assets that are clearly yours. The work we've done over two years ensures that. If you do move toward a shared life with David, the first step I'd recommend is a prenuptial agreement — not because I expect a bad outcome, but because it creates a clear conversation about what is pre-marital, what becomes marital, and how you both treat each other financially."},
    {"speaker": "client",  "text": "My ex-husband would never have agreed to a prenuptial agreement. I didn't have the confidence to insist on it. I do now."},
    {"speaker": "advisor", "text": "That is a profound statement of growth. For the record: your one-million-dollar investment portfolio is entirely pre-marital and should be explicitly protected as separate property in any agreement you make. The contribution made during a future marriage through shared savings is marital — that's appropriate. But the base you've built belongs to you and the kids."},
    {"speaker": "client",  "text": "That's exactly how I see it. What about beneficiaries? My will currently names Emma and Liam as equal beneficiaries with my sister Maria as executor and their guardian. Do any changes make sense at this point?"},
    {"speaker": "advisor", "text": "Not yet — and I'd encourage leaving the beneficiaries exactly as they are until there is a formal legal commitment. What I do want to update is your IRA beneficiary form, which still reflects your name and social security number from the divorce settlement rollover but needs a review to confirm the contingent beneficiary designations are current as of the estate documents we set up eighteen months ago."},
    {"speaker": "client",  "text": "I want to make sure Emma and Liam are protected no matter what happens on the relationship side. That's the non-negotiable."},
    {"speaker": "advisor", "text": "They are protected. Your will, the guardian designation naming Maria, the life insurance policy benefiting the estate that passes through to them — it's all current and intact. If and when you choose to bring David into your financial life, we'll update those documents with intention and care. Not before."},
    {"speaker": "client",  "text": "Thank you for saying that. The last advisor I had never once asked about my kids as people. You've known Emma and Liam's names for two years."},
    {"speaker": "advisor", "text": "Emma is going to college in the fall. Liam is a competitive swimmer who transformed when he found his sport. Those are the things your financial plan is actually for. The numbers are just the structure underneath the life."},
    {"speaker": "client",  "text": "That's exactly what I needed to hear. See you in six months."},
]
