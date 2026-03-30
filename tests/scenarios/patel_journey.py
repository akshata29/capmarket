"""
Dr. Priya Patel — Multi-Meeting Journey (Meetings 2 through 6)

Building on the initial prospecting meeting (DR_PRIYA_PATEL in profiles.py),
this module captures Priya's journey from "brilliant late starter" to
disciplined wealth accumulator — navigating a demanding career, her family's
evolving needs, and two major financial pivot points:

  M2  Onboarding / Backdoor Roth + Catch-Up Strategy   Jan 2024  — 2 weeks after M1
  M3  Partnership Buy-In Decision                       Jun 2024  — surprise opportunity
  M4  Annual Review / Catch-Up Working                  Jan 2025  — ~12 months in
  M5  Vikram's Business Plan                            Jul 2025  — family tension
  M6  Practice Partner Exit Opportunity                 Jan 2026  — crossroads decision

Key themes:
  - Aggressive catch-up investing: strategy precision beats panic
  - Whole-life insurance skepticism: the financial product that preys on doctors
  - Partnership buy-in as human capital investment, not just capital outlay
  - Balancing Vikram's entrepreneurial ambitions vs. Priya's financial plan
  - Building toward 62 retirement from a standing start at 44
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# MEETING 2  —  Onboarding / Catch-Up Architecture
# Date: mid-January 2024 (~2 weeks after M1)
# Meeting type: onboarding
# Context: Priya has $160K in her 401k, $55K in brokerage, and fresh
#   determination after paying off her medical school loans. Vikram earns
#   $35K part-time in school tutoring. The practice has a group 401k but
#   no solo 401k option for her. Two kids: Rohan (10), Ananya (8). Goal:
#   retire at 62 from a standing start. Colleague Dr. Mehta is about to
#   pitch her a whole-life insurance policy — she can see it coming.
#   Sentiment: focused, analytical, slightly self-critical about the lost decade.
# ---------------------------------------------------------------------------
PATEL_M2_ONBOARDING = [
    {"speaker": "advisor", "text": "Priya — let's build the blueprint. You told me at the end of our first meeting that you feel like you're starting a hundred meters behind everyone else. By the end of today you're going to see exactly why that's not the obstacle it feels like. Ready?"},
    {"speaker": "client",  "text": "I've cleared my afternoon. Rohan and Ananya are at their grandmother's. I want to understand every number before I leave this office."},
    {"speaker": "advisor", "text": "Perfect. Let's start with the catch-up math. You're forty-four. Your retirement target is sixty-two — eighteen years. Your starting portfolio: two hundred fifteen thousand total between 401k and brokerage. Your income is four hundred thirty thousand and growing. Here's what most high earners in your position don't understand: the constraint isn't time, it's savings rate. At four hundred thirty thousand, if you save aggressively and invest correctly, eighteen years is entirely sufficient."},
    {"speaker": "client",  "text": "I've done rough math. If I max out the 401k and save aggressively in after-tax accounts, can we actually hit a number that replaces my income in eighteen years?"},
    {"speaker": "advisor", "text": "At four hundred thirty thousand income and a forty percent marginal federal and state tax rate, you net approximately two hundred fifty-eight thousand per year. If you can save one hundred thirty-five thousand per year — about fifty-two percent of your net income — over eighteen years at seven percent real returns, you accumulate approximately four point one million dollars. At a four percent withdrawal rate, that generates one hundred sixty-four thousand annually — more than your current take-home. You retire at sixty-two."},
    {"speaker": "client",  "text": "One hundred thirty-five thousand per year in savings. That's aggressive but I think it's possible if Vikram's income covers some household expenses and we're disciplined. What are the specific vehicles in order?"},
    {"speaker": "advisor", "text": "In order of priority: First, your group 401k to the twenty-three thousand dollar maximum plus a seven thousand five hundred catch-up contribution — total thirty thousand five hundred. That's the baseline. Second, backdoor Roth IRA — seven thousand dollars per year. This is the two-step process: contribute to a traditional IRA and immediately convert to Roth. At your income, you can't contribute directly to a Roth, but the backdoor strategy is perfectly legal and in wide use."},
    {"speaker": "client",  "text": "I know two colleagues who do this. Walk me through the pro-rata rule — I've heard this can create a tax problem if you have existing traditional IRA money."},
    {"speaker": "advisor", "text": "Exactly right to ask. The pro-rata rule says if you have any pre-tax IRA money outstanding, the conversion becomes partially taxable. The solution: if your practice's 401k plan accepts rollovers, roll your existing traditional IRA money into the 401k before doing the backdoor. This clears the traditional IRA balance to zero, making the backdoor contribution entirely tax-free. You have no traditional IRA currently, so you're clean — we just keep it that way."},
    {"speaker": "client",  "text": "So the sequence is: contribute seven thousand to traditional IRA, immediately convert to Roth, correct?"},
    {"speaker": "advisor", "text": "Within days — don't let it sit long enough to appreciate, which would create a small taxable gain on conversion. Now: mega backdoor Roth. Does your 401k plan allow after-tax contributions beyond the employee contribution limit?"},
    {"speaker": "client",  "text": "I asked HR last week. The plan documents do allow after-tax contributions and in-service distributions. So yes."},
    {"speaker": "advisor", "text": "Outstanding. The total 401k limit including after-tax is sixty-nine thousand dollars. You're contributing thirty thousand five hundred. That means you can contribute up to thirty-eight thousand five hundred in after-tax dollars and immediately convert that to Roth within the plan — the mega backdoor. That gives you a Roth balance growing tax-free on nearly forty thousand additional per year. Over eighteen years that's a massive tax-free wealth engine."},
    {"speaker": "client",  "text": "I had no idea that was available inside a standard 401k. Why doesn't everyone do this?"},
    {"speaker": "advisor", "text": "Most people don't know it exists, and many plans don't allow it. You are fortunate to be in a plan that does. Now — 529 accounts for Rohan and Ananya. Rohan is ten, eight years to college. Ananya is eight, ten years. If we fund fifty thousand each today and contribute ten thousand per year per child, at seven percent growth: Rohan's account reaches approximately two hundred fifteen thousand. Ananya's reaches approximately two hundred fifty thousand. Both college costs fully covered with graduate school cushion."},
    {"speaker": "client",  "text": "I will fund both this week. Done. What else?"},
    {"speaker": "advisor", "text": "I want to alert you to a conversation I suspect is coming. Has Dr. Mehta or anyone at the practice suggested you look at whole life insurance?"},
    {"speaker": "client",  "text": "Dr. Mehta has mentioned it twice in the last two months. He says it's how he 'protects family and builds wealth simultaneously.' I know it's a commissioned product but I don't have the counterarguments ready."},
    {"speaker": "advisor", "text": "Here they are. Whole life insurance combines a death benefit and a savings vehicle. The savings vehicle returns approximately two to three percent annually compared to the stock market's historical seven to ten percent. The commission on a whole life policy is seven to twelve percent of premium in the first year — which is why it gets sold to high-income professionals aggressively. You need a death benefit. You don't need the savings vehicle at those costs. The correct answer is: two million dollars in twenty-year term life insurance for approximately two thousand to twenty-five hundred dollars per year. Protect your family at minimal cost, invest the difference in your portfolio."},
    {"speaker": "client",  "text": "When Dr. Mehta brings it up again, I want to be able to say 'I've analyzed this carefully and declined.' Can I share your name if he pushes?"},
    {"speaker": "advisor", "text": "Yes. And tell him his advisor is earning a significant commission while you're building four million dollars for retirement through actual investing. That usually ends the conversation."},
    {"speaker": "client",  "text": "I feel like I'm finally building the knowledge to protect myself financially the same way I protect patients clinically. This is going to work."},
    {"speaker": "advisor", "text": "It absolutely will. We just built a one hundred thirty-five thousand dollar annual savings engine using tools that most doctors never access. You didn't lose a decade — you're about to make it irrelevant."},
]

# ---------------------------------------------------------------------------
# MEETING 3  —  Partnership Buy-In Decision
# Date: June 2024 (~5 months after onboarding)
# Meeting type: planning
# Context: Priya's pediatric practice group has offered her named partner
#   status — which means equity in the practice and full voting rights.
#   Required buy-in: $280K, payable within 60 days. She can fund ~$180K
#   from brokerage (after tax) and would need a $100K HELOC on her home.
#   The practice generates about $60K/year in partner distributions above
#   her current compensation. Is it worth it? She has five months of
#   progress in her portfolio to review.
#   Sentiment: excited but careful; doesn't want to derail the plan she just built.
# ---------------------------------------------------------------------------
PATEL_M3_PARTNERSHIP_BUYIN = [
    {"speaker": "advisor", "text": "You said urgent in the message. What's happening?"},
    {"speaker": "client",  "text": "The practice offered me named partnership. The buy-in is two hundred eighty thousand dollars. I have sixty days to decide and fund. This is everything I've wanted professionally — I'd have equity in a practice I've spent four years building. But I built a financial plan in January and I don't want to destroy it."},
    {"speaker": "advisor", "text": "Walk me through the partnership structure. What does named partnership actually deliver financially?"},
    {"speaker": "client",  "text": "Partner distribution on top of base salary, which they estimate at sixty thousand per year depending on practice performance. Partners also share in any future practice sale — the group has been acquiring smaller practices and is potentially acquisition-ready in four to six years. The current practice enterprise value is approximately four million. My share as one of six partners would be roughly six hundred sixty-seven thousand in a purchase event."},
    {"speaker": "advisor", "text": "So the financial analysis has two components: ongoing distributions and a potential exit event. At sixty thousand per year incremental in distributions, the simple payback on two hundred eighty thousand is four point six years. If the practice sale happens at year five with a six hundred sixty-seven thousand payout, your total return on the two hundred eighty thousand investment potentially approaches one million three hundred thousand over five years. That is an excellent return."},
    {"speaker": "client",  "text": "The challenge is funding. I have one hundred eighty thousand in brokerage. After capital gains tax on selling appreciated positions — probably thirty percent effective combined — I net approximately one hundred twenty-six thousand. I need one hundred fifty-four thousand more."},
    {"speaker": "advisor", "text": "Your home equity is approximately one hundred eighty thousand. A HELOC at current rates could provide one hundred thousand comfortably within your equity cushion. That gets you to two hundred twenty-six thousand — still a gap of fifty-four thousand to the two hundred eighty thousand required."},
    {"speaker": "client",  "text": "The practice would also consider seller financing. They've done this for one other partner — essentially a promissory note where I pay the remaining balance over two years from the distributions themselves."},
    {"speaker": "advisor", "text": "That is the most elegant structure available: seller-financed gap at favorable terms. You deploy an hundred twenty-six thousand from brokerage liquidation, a hundred thousand from HELOC, and negotiate a fifty-four thousand seller note paid back from the first two years of partnership distributions. Zero new cash required beyond what you have. Effective out-of-pocket: zero, plus the interest cost of the HELOC."},
    {"speaker": "client",  "text": "What happens to my retirement plan? I've been three months into the aggressive contribution strategy. I lose one hundred eighty thousand in brokerage that was earmarked for retirement."},
    {"speaker": "advisor", "text": "Temporary setback, not a derailment. The brokerage was taxable money. The partnership buy-in is a human capital investment that pays back in four to five years with a potential large exit event. More importantly, your annual savings rate from the 401k and backdoor Roth is unchanged — that continues during the HELOC repayment period. You're replacing a passive taxable brokerage investment with an active business investment. The return profile of the business investment is higher."},
    {"speaker": "client",  "text": "What are the risks? What's the scenario where this is a bad decision?"},
    {"speaker": "advisor", "text": "Three risk scenarios: One — the practice doesn't get acquired and distributions underperform expectations. In this case you've simply paid two hundred eighty thousand for a better-compensated position that still generates positive ROI over time. Two — you leave the practice. Your buy-in is typically redeemable at book value under partner exit provisions — you should verify those terms explicitly. Three — practice performance declines and partner distributions drop. This is practice-specific business risk. How confident are you in the group's trajectory?"},
    {"speaker": "client",  "text": "We have five pediatricians and a twelve-year reputation. We're the third largest pediatric group in the county. Our revenue has grown twelve percent year over year for three consecutive years. I'm comfortable with the business risk."},
    {"speaker": "advisor", "text": "Then this is not a difficult decision financially. The question I'd ask you personally: do you want to own part of this practice? Not just financially — do you want the governance responsibility, the legal exposure, the organizational identity?"},
    {"speaker": "client",  "text": "I've spent four years building this practice's reputation. Three of the five partners learned chronic disease pediatric protocols from me. If I'm going to be here for the next eighteen years until I retire at sixty-two, I should own part of what I'm building."},
    {"speaker": "advisor", "text": "Then do it. Get the buy-in documents to your attorney this week, negotiate the seller finance on the gap, and send me the partnership agreement for financial review before signing. This is a good decision."},
    {"speaker": "client",  "text": "I needed someone to walk this through systematically. My husband's instinct was 'yes, do it' and my instinct was 'what about the plan.' Both were right."},
]

# ---------------------------------------------------------------------------
# MEETING 4  —  Annual Review / Catch-Up Is Working
# Date: January 2025 (~12 months after onboarding)
# Meeting type: annual_review
# Context: One year of the aggressive catch-up strategy. Partnership buy-in
#   funded and complete — distributions have been flowing for 7 months.
#   401k: $280K. Brokerage: rebuilt to $90K after the liquidation.
#   Backdoor Roth: second year contribution made. 529s growing.
#   Vikram picked up a second tutoring client and is now at $48K income.
#   Rohan is 11 — 7 years to college. Ananya is 9.
#   Sentiment: Priya is genuinely surprised by her own progress.
# ---------------------------------------------------------------------------
PATEL_M4_ANNUAL_REVIEW = [
    {"speaker": "advisor", "text": "One year in. Let's see what the numbers say. I want you to look at this before I frame it — just read the summary page."},
    {"speaker": "client",  "text": "The 401k is at two hundred eighty thousand. Brokerage is at eighty-seven thousand, rebuilt from the partnership liquidation. The two 529s together are at one hundred seventeen thousand. Roth IRA between the two backdoor years is at eighteen thousand. The partnership distributions represent sixty-one thousand additional income this year. And the HELOC is paid down to forty-eight thousand outstanding."},
    {"speaker": "advisor", "text": "In twelve months, your investable net worth excluding the practice equity and home equity grew from two hundred fifteen thousand to five hundred two thousand. You added nearly three hundred thousand dollars to your financial security in one year. At forty-four becoming forty-five, that is a significant acceleration."},
    {"speaker": "client",  "text": "I feel it. I looked at my 401k balance in January of last year and felt so far behind. Now I look at it and feel — momentum. Like compounding is actually working."},
    {"speaker": "advisor", "text": "Compounding works fastest when you're contributing aggressively to a growing balance. You're in what I call the 'slope steepening phase' — each year the absolute dollar growth accelerates even at constant contribution rates because you're earning returns on a larger base."},
    {"speaker": "client",  "text": "Walk me through the retirement projection now that we have one year of actual data."},
    {"speaker": "advisor", "text": "Revised projection with current balances and seventeen years to age sixty-two: if you continue the current savings rate of one hundred thirty-seven thousand per year across all vehicles, the portfolio reaches four million six hundred thousand at a six and a half percent real return. The practice sale upside — if it occurs — would add a potential six hundred to eight hundred thousand on top of that. You're now projecting to possibly retire with five to five point four million. That is twenty percent better than the original target."},
    {"speaker": "client",  "text": "The partnership buy-in accelerated the trajectory rather than delaying it. I didn't expect that."},
    {"speaker": "advisor", "text": "The sixty-one thousand in distributions effectively increased your savings rate without decreasing lifestyle. You saved the distributions rather than spending them — that's financial discipline most physicians don't demonstrate."},
    {"speaker": "client",  "text": "Rohan is eleven now. Seven years to college. What does the 529 look like for him?"},
    {"speaker": "advisor", "text": "Rohan's 529 is at sixty-three thousand after one year of contributions. At ten thousand per year and seven percent growth for seven years, it projects to one hundred sixty-seven thousand at his enrollment. Four-year private university fully funded, with likely forty to fifty thousand remaining for graduate school."},
    {"speaker": "client",  "text": "Ananya's is at fifty-four thousand with nine years. She'll have more time."},
    {"speaker": "advisor", "text": "Ananya projects to approximately one hundred ninety-two thousand — solid. I want to do one important administrative review: your beneficiary designations. The 401k, both Roth IRAs, the 529s — do all of them correctly name Vikram as primary and your children as contingent?"},
    {"speaker": "client",  "text": "I updated everything at the estate attorney visit six months ago. Vikram is primary on all investment accounts. Rohan and Ananya are contingent with equal shares. My term life insurance names Vikram primary with a testamentary trust for the children."},
    {"speaker": "advisor", "text": "Perfect. One thing I want to bring up proactively: has there been any discussion at the practice about a potential acquisition timeline?"},
    {"speaker": "client",  "text": "The managing partner mentioned last month that we had received 'preliminary interest from a regional healthcare network.' He asked each partner about their timeline preference. I said I'm in no hurry — I plan to practice until sixty-two."},
    {"speaker": "advisor", "text": "Hold that position. The partner who signals urgency to sell gets the lowest valuation. Your patience is a negotiating asset, both for the partnership and for your personal financial plan."},
]

# ---------------------------------------------------------------------------
# MEETING 5  —  Vikram's Business Plan
# Date: July 2025 (~18 months after onboarding)
# Meeting type: planning
# Context: Vikram has a business plan. He wants to open a learning center /
#   tutoring center focused on STEM education for middle-school students.
#   Startup cost estimate: $150K. He's been running independent tutoring for
#   two years and has a waiting list. Priya is proud but torn — the $150K
#   would come from shared family finances and the business has no guarantee.
#   Tension: Priya's discipline is in direct tension with Vikram's ambition.
#   Neither is wrong.
# ---------------------------------------------------------------------------
PATEL_M5_VIKRAM_BUSINESS = [
    {"speaker": "advisor", "text": "Priya — you mentioned Vikram on the phone and there was something in your tone. What's the situation?"},
    {"speaker": "client",  "text": "Vikram wants to open a learning center. STEM tutoring, physical space, two to three employees. He has a full business plan — he's been working on it for three months. I'm proud of him. He is genuinely talented with kids and he has forty students on a waiting list. But the startup cost is one hundred fifty thousand dollars."},
    {"speaker": "advisor", "text": "Is he asking for your support to fund it, or has he found outside funding?"},
    {"speaker": "client",  "text": "He's asking to use family savings. He says it's an investment in our future, that the business could generate a hundred thousand per year within three years. He's probably right. But one hundred fifty thousand is one year of my retirement contributions. I don't know how to evaluate this."},
    {"speaker": "advisor", "text": "Let me help you think through this structurally rather than emotionally. A hundred fifty thousand from family savings at this point — what available capital are we looking at?"},
    {"speaker": "client",  "text": "Brokerage is at one hundred sixty thousand after all contributions this year. The HELOC is fully paid off — zero balance, one hundred eighty thousand available. 529s and retirement accounts I don't want to touch."},
    {"speaker": "advisor", "text": "Okay. There are two or three ways to think about funding this if you decide to proceed. First option: Vikram funds it himself by taking a business loan. A small business loan for one hundred fifty thousand on his business plan with a waiting list of forty students? That's actually financeable. He doesn't need family money for this — he may not have tried a business loan yet because it feels harder."},
    {"speaker": "client",  "text": "He hasn't tried. His instinct was to ask us first. That is probably the right first conversation to have — could he fund this himself?"},
    {"speaker": "advisor", "text": "Second option: if you want to support him, use the HELOC — not the brokerage. A HELOC at your current rate is eight to nine percent. Business lending to your spouse is a family decision, but the HELOC preserves the brokerage portfolio intact and keeps the retirement plan on track. The repayment risk is contained to home equity."},
    {"speaker": "client",  "text": "I hadn't separated the question of 'should we support him' from 'how do we support him.' Those are actually two different decisions."},
    {"speaker": "advisor", "text": "Exactly. And there's a third consideration: Vikram's business succeeds. He's earning a hundred thousand per year in three years. At that point, his contribution to household income increases from forty-eight thousand to one hundred thousand. Your joint savings capacity increases by fifty thousand per year. The business pays for itself from a family financial perspective within three to four years."},
    {"speaker": "client",  "text": "When you frame it as a return on investment to family income rather than a pure cost, it looks different. The question is the execution risk."},
    {"speaker": "advisor", "text": "What's your read on his likelihood of success? You know this man better than any financial model."},
    {"speaker": "client",  "text": "He is the best teacher I have ever seen — and I've watched hundreds of resident rotations. If the constraint is just capital and will, the probability of success is high. His risk is management and operations, which are learnable. I worry about him more than I doubt him."},
    {"speaker": "advisor", "text": "Then I'd encourage two steps: First, take Vikram through the business loan conversation — let him own the financing quest if he can. Second, if outside funding falls short, offer a HELOC contribution as a family investment, not a gift. Structure it with a simple family note — he repays the HELOC contribution from business revenues. It protects both your retirement trajectory and his sense of ownership in what he builds."},
    {"speaker": "client",  "text": "The family note idea is important. If I just give him one hundred fifty thousand, there's no accountability. If he borrows it with an expectation of repayment from business income, he has skin in the game and I have a retirement plan that isn't disrupted."},
    {"speaker": "advisor", "text": "You're protecting the plan AND supporting your husband. Those aren't mutually exclusive — but it takes structure to make them compatible."},
    {"speaker": "client",  "text": "I'm going to have this conversation with Vikram tonight. I'll lead with 'I believe in you, let's figure out how to make this work' instead of 'We can't afford this.' The framing matters enormously."},
    {"speaker": "advisor", "text": "That instinct is right. And come back in six months with an update. I want to know how the learning center story begins."},
]

# ---------------------------------------------------------------------------
# MEETING 6  —  Practice Partner Exit Opportunity
# Date: January 2026 (~24 months after onboarding)
# Meeting type: planning
# Context: Dr. Richard Chen — the senior founding partner and Priya's mentor
#   — is retiring at 68. His one-sixth share of the partnership is available
#   for buyout by current partners. This is the second buy-in event in 18
#   months. Priya could deepen her equity stake — but at what cost to her
#   financial plan? The practice acquisition discussion has also intensified.
#   Vikram's learning center opened three months ago with 28 enrolled students.
# ---------------------------------------------------------------------------
PATEL_M6_PARTNER_EXIT = [
    {"speaker": "advisor", "text": "Two years since our first real meeting. You look like a different person than the one who walked in with a list of everything that was wrong. What's the urgent question?"},
    {"speaker": "client",  "text": "Dr. Chen is retiring. He founded this practice thirty-one years ago. He's offering his one-sixth share to existing partners at a favorable rate — three hundred twenty thousand. The partners have sixty days to acquire his share collectively or it enters the market to an outside buyer."},
    {"speaker": "advisor", "text": "If an outside buyer acquires his share, they become a one-sixth partner in your practice. That introduces an entity with different interests and potentially different exit timeline preferences into your partnership. What does the rest of the partner group want to do?"},
    {"speaker": "client",  "text": "Two partners want to divide his share proportionally among the five of us — that increases each partner's stake by a one-sixth fractional amount. Two partners want to pass and let the outside buyer in. I'm the deciding vote."},
    {"speaker": "advisor", "text": "What is the financial case for the additional buy-in? What does acquiring a fractional one-sixth stake add to your annual distributions and your exit value?"},
    {"speaker": "client",  "text": "At a proportional division, each of us absorbs sixty-four thousand dollars of the three hundred twenty thousand cost. My stake would go from one-sixth to approximately one-fifth of the practice. My proportional share of distributions increases by about twelve thousand per year. In an acquisition event, my share of a four-million-dollar practice purchase goes from six hundred sixty-seven thousand to approximately eight hundred thousand."},
    {"speaker": "advisor", "text": "Sixty-four thousand dollars for twelve thousand per year additional income is a five-year payback — plus the upside on acquisition value increases by one hundred thirty-three thousand. That is an excellent return at sixty-four thousand. This is substantially more attractive than the original two hundred eighty thousand buy-in on a per-dollar basis."},
    {"speaker": "client",  "text": "My hesitation is not financial. It's personal. Dr. Chen is effectively the heart of this practice. When he retires, something changes. I've been thinking about whether I want to double down on this partnership or whether the partnership will change in ways I haven't anticipated."},
    {"speaker": "advisor", "text": "That is the most important question, and it's not one I can answer. What I can say is this: if the acquisition happens within eighteen to twenty-four months as the signals suggest, the sixty-four thousand investment might return three to four times its cost in the acquisition event alone. Separate from the partnership culture question, the arithmetic on this is unusually favorable."},
    {"speaker": "client",  "text": "Vikram's learning center has twenty-eight students and is trending toward forty. He doesn't need emergency capital. The HELOC has twenty-two thousand borrowed — manageable. If I fund this from the brokerage, which is now at one hundred seventy-four thousand, I can do it without disrupting any retirement account."},
    {"speaker": "advisor", "text": "You've structured your finances to make exactly this kind of decision possible — liquid capital available for human capital investment without touching the retirement engines. That's the plan working."},
    {"speaker": "client",  "text": "Here is what I keep coming back to: Dr. Chen built something for thirty-one years. When he decided I was worthy of partnership, he was passing something to me. I don't want to be the partner who let an outside buyer in and changed what he built. I want to honor what he created."},
    {"speaker": "advisor", "text": "Sixty-four thousand dollars to honor your mentor's legacy while generating a large expected return on a favorable acquisition timeline. That is one of the easier decisions to model."},
    {"speaker": "client",  "text": "I'm in. I'll tell Dr. Babu today. What's the tax treatment on these partnership equity purchases?"},
    {"speaker": "advisor", "text": "Partnership interest purchases are capital assets. Your basis increases to three hundred forty-four thousand combined. In a practice acquisition event, your gain is calculated on those proceeds above the stepped-up basis. We'll plan the tax sequencing when the acquisition term sheet arrives — which I suspect is coming in the next eighteen months. Be ready for that conversation."},
    {"speaker": "client",  "text": "Two years ago I walked in feeling like a financial failure who had wasted her thirties. Today I have a partnership stake I'm about to deepen, a retirement plan on track for four point five million, two children whose college is substantially funded, and a husband who opened a business. I didn't waste my thirties. I earned a medical degree and built a practice and raised a family. I just needed to learn the financial piece."},
    {"speaker": "advisor", "text": "You learned it fast, Priya. That's the only part you needed."},
]
