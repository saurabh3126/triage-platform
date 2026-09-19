# Decision Points

This document explains our choices for the three required Decision Points in FactTriage.

---

### DP1 · Feed order
**Question:** *How is the public feed ordered: recency, risk, status, something else? Why?*

**Our Choice:** **Highest Risk First by default**, with an option for users to switch to **Most Recent First**.

**Why:**
When misinformation goes viral, the posts doing the most damage are usually the ones shouting the loudest and spreading the fastest. Sorting by highest risk ensures that the most alarming, unsourced claims get put in front of reviewers and the community right away before they spread further. Chronological feeds often push dangerous rumors down the page beneath harmless updates, so prioritizing by threat severity makes the triage queue far more effective. Users who just want to monitor incoming submissions in real time can still flip the toggle back to most recent whenever they want.

---

### DP2 · Visibility
**Question:** *Are unverified claims publicly visible, or held back until reviewed? Why?*

**Our Choice:** **Publicly visible immediately**, clearly labeled with an **Unverified** badge and their initial risk flags.

**Why:**
Hiding unverified claims behind a private moderator queue creates a blind spot during breaking news events, which is exactly when false stories spread unchecked on messaging apps. By putting submissions out in the open right away with an obvious "Unverified" warning, readers are alerted to suspect rumors before accepting them as truth. This open visibility also lets everyday users bring in evidence, suggest sources, and dispute incorrect verdicts without waiting around for a single reviewer to clear a backlog.

---

### DP3 · Editing
**Question:** *Can a claim be edited after submission, and what happens to its flags? Why?*

**Our Choice:** **Claims cannot be edited after submission.** Any updates, corrections, or new context must go through reviewer notes, community dispute votes, and the audit trail.

**Why:**
Allowing people to edit claim text after the fact opens the door to bait-and-switch abuse, where someone submits an innocent claim to get a "Verified True" checkmark and then swaps in harmful misinformation later. On top of that, modifying the text would break the automated risk flags calculated on submission and confuse community members who already cast votes on the original wording. Keeping the submitted post immutable and documenting every follow-up note and status change in the audit trail keeps the entire review process honest and transparent.
