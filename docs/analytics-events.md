# Analytics events — AI Readiness Assessment

GA4 / Firebase property: G-E8SG75CGDK (campanha-readiness-assessment)
Source: app/analyticsFunnel.ts (names), app/page.tsx (firing), app/firebaseAnalytics.ts (transport),
app/visitorClass.ts (human verification)

## Automatic events (collected by GA4 itself)

Firebase Analytics is initialized on mount, before the draft loads, so these are
collected even for a visitor who leaves without answering anything:

- page_view
- session_start
- first_visit
- user_engagement

Plus the standard traffic-source, campaign, device and geo dimensions.

## Custom funnel events

Fired once per assessment attempt and remembered in localStorage
(key: snowfox-ai-analytics-funnel-v1), so resuming a saved draft does not
recount a step that was already measured.

| Event | Meaning |
| --- | --- |
| assessment_view | The assessment UI rendered. Fired once per page load rather than per attempt, so a returning respondent counts again. Includes `resumed`. |
| first_question_completed | At least one question resolved — answered outright or skipped by branching. |
| assessment_halfway | Progress reached 50%. |
| last_question_completed | Every visible question in every section resolved; the questionnaire is finished. |
| contact_form_view | The contact-information gate is on screen. |
| contact_info_submitted | Contact details submitted. The conversion event. |
| results_viewed | The personalized report rendered. |
| section_completed | One named section finished. Fires up to 5x per attempt; separate the sections with the `section_id` / `section_index` parameters. |
| assessment_heartbeat | Running engagement report: first at 10s, then every 30s while the tab is visible. Carries the engagement figure under `engagement_time_msec` for a verified human and `unverified_engagement_msec` otherwise — see Human verification. |

## Sections reported by section_completed

| section_id | section_index | Title (PT / EN) |
| --- | --- | --- |
| dados | 0 | Dados / Data |
| estrategia | 1 | Estrategia / Strategy |
| pessoas | 2 | Pessoas / People |
| governanca | 3 | Governanca / Governance |
| tecnologia | 4 | Tecnologia / Technology |

## Event parameters

Attribution — on every custom event, from UTM parameters, persisted so a later
visit without a query string is still attributed:

- post_id
- post_source
- post_medium
- post_campaign
- post_term

Progress:

- lang — questionnaire language
- progress_percent — completion, 0-100
- questions_answered — questions resolved so far
- active_seconds — foreground time when the milestone was reached (time-to-milestone)
- resumed — assessment_view only; the respondent continued a saved draft
- section_id, section_index — section_completed only
- engagement_time_msec — assessment_heartbeat, verified humans only
- unverified_engagement_msec — assessment_heartbeat, unverified visits only

Verification — on every custom event:

- visitor_type — `human` or `unverified`; see below

No respondent identity is ever sent to Analytics. `visitor_type` describes what
a visit did, never who made it.

## Human verification

**Register the custom definitions in GA4 before this ships.** Event-scoped
custom dimensions are not retroactive: data collected before registration
cannot be queried by that dimension, and every report shows "(not set)".

- Admin → Data display → Custom definitions → Create custom dimension:
  name `Visitor type`, scope Event, event parameter `visitor_type`.
- Same screen, Custom metrics → Create custom metric: name
  `Unverified engagement`, scope Event, parameter `unverified_engagement_msec`,
  unit Milliseconds.

### What verifies a visit

A visit becomes `human` when both hold:

1. A `pointerdown` or `keydown` event reached the page with `isTrusted` set.
   `scroll` is deliberately excluded — the engine marks a programmatic scroll
   trusted and the assessment scrolls itself to the top on every section
   change, so it would verify visits nobody touched.
2. Foreground time reached 10s, which is GA4's own engaged-session threshold
   and the moment the first heartbeat reports.

The verdict is sticky and stored under `snowfox-ai-visitor-v1`, so a resumed
draft opens already verified. Restarting the assessment does not clear it: the
click that restarts is itself a human gesture.

### Reading it

`unverified` is not a claim that the visitor is a bot. `isTrusted` rejects a
script-dispatched click, but automation driven through the devtools protocol
injects input at the browser level and produces trusted events. `unverified`
means only that no human interaction was demonstrated — which also covers a
real person who landed and left inside ten seconds.

Read the bot-share estimate at **session** scope ("sessions containing at least
one `human` event"), not event scope: the events a genuine visit fires before
it verifies are correctly labelled `unverified`, and counting per-event would
double-count them as bot volume.

`assessment_view` fires on hydration, before interaction is possible, so on a
first visit it is always `unverified`. GA4 cannot relabel an event after the
fact; each event keeps the verdict it was sent under.

### Why the engagement figure is split rather than labelled

GA4 builds average engagement time and engaged sessions from
`engagement_time_msec` alone, and a custom label cannot pull a value back out
of a built-in metric. Reporting unverified time under a separate name keeps it
countable in an exploration while leaving the property's headline engagement
metrics describing verified humans only.

### Automatic events are not covered

`page_view`, `session_start`, `first_visit` and `user_engagement` are emitted
by the SDK, never through `trackEvent`, so they carry no `visitor_type`. The
headline Users and Sessions figures in standard reports stay unfilterable. A
user-scoped property via `setUserProperties` would close this gap and is the
natural follow-up if the session-level split matters.

### traffic_type was evaluated and rejected

GA4's native `traffic_type` parameter plus an Admin data filter would drop the
traffic at collection time, which contradicts keeping unverified visits
visible. It must also be set at config time, before events flow, whereas this
verdict is unknown at load and flips 10s or more later.
