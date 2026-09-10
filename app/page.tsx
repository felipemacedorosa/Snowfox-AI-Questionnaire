"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Navbar, type AppScreen, type SaveState } from "@/components/Navbar";
import { QuizScreen } from "@/components/quiz/QuizScreen";
import { ReportIdentityGate, type ReportSubmitState } from "@/components/results/ReportIdentityGate";
import { ResultsScreen } from "@/components/results/ResultsScreen";
import {
  buildAssessmentDraft,
  parseAssessmentDraft,
  type AssessmentDraftState,
  type AssessmentDraftV2,
  type ReportSubmissionReceipt,
} from "./assessmentDraft";
import { type AnswerRecord, SECTIONS, clearDependentAnswers, getAssessmentProgress, getSectionProgress, getSections } from "./data";
import { useLanguage } from "./LanguageContext";
import { buildReportSnapshot, type ParticipantIdentity, type ReportSnapshot } from "./reportSnapshot";
import { getReportSubmissionRecovery, ReportSubmissionError, submitReportSnapshot } from "./reportSubmission";
import {
  clearFiredMilestones,
  milestoneEventName,
  parseSectionMilestoneKey,
  pendingMilestones,
  persistFiredMilestones,
  readFiredMilestones,
  type MilestoneKey,
} from "./analyticsFunnel";
import {
  HEARTBEAT_EVENT,
  FIRST_HEARTBEAT_DELAY_MS,
  HEARTBEAT_INTERVAL_MS,
  activeMs,
  activeSeconds,
  engagementDeltaMs,
  bankStretch,
  clearTimingState,
  exhausted,
  persistTimingState,
  readTimingState,
  startStretch,
  stopStretch,
  type TimingState,
} from "./assessmentTiming";
import { initAnalytics, trackEvent } from "./firebaseAnalytics";
import {
  hasAttribution,
  parseAttribution,
  persistAttribution,
  readStoredAttribution,
  resolveAttribution,
  toEventParams,
  type Attribution,
} from "./attribution";
import {
  VISIT_VERIFIED_EVENT,
  VISITOR_HUMAN,
  classifyVisitor,
  observeTrustedInteraction,
  persistVisitorVerified,
  readVisitorClass,
  shouldReportVerification,
  toEngagementParams,
  toVisitorParams,
  type VisitorClass,
} from "./visitorClass";
// DEV SHORTCUT (remove with app/devShortcuts.ts): see effect below.
import { buildStrategyGapTestAnswers } from "./devShortcuts";

const STORAGE_KEY = "snowfox-ai-assessment-v1";

// Not a server code: the browser refused to persist the draft locally.
const LOCAL_SAVE_ERROR = "__local_save__";

function clampSection(section: number) {
  return Math.min(Math.max(Math.round(section), 0), SECTIONS.length - 1);
}

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("quiz");
  const [section, setSection] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord>({});
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [resumeScreen, setResumeScreen] = useState<"quiz" | "results" | null>(null);
  const [pendingReport, setPendingReport] = useState<ReportSnapshot | null>(null);
  const [reportReceipt, setReportReceipt] = useState<ReportSubmissionReceipt | null>(null);
  const [reportSubmitState, setReportSubmitState] = useState<ReportSubmitState>("idle");
  const [reportSubmitErrorCode, setReportSubmitErrorCode] = useState<string | null>(null);
  const activeSubmissionId = useRef<string | null>(null);
  const resumedPendingReport = useRef(false);
  const firedMilestones = useRef<Set<MilestoneKey> | null>(null);
  const trackedAssessmentView = useRef(false);
  const attributionRef = useRef<Attribution | null>(null);
  const timing = useRef<TimingState | null>(null);
  /**
   * Active milliseconds already reported to Analytics as engagement.
   *
   * Seeded from the time a previous load banked, so resuming a draft reports
   * only what this load adds rather than re-reporting the whole clock.
   */
  const reportedEngagement = useRef<number | null>(null);
  /** A trusted gesture has reached this load. Set by the observer, never reset. */
  const interacted = useRef(false);
  /** Verification recovered from storage, then latched. Null until first read. */
  const humanVerified = useRef<boolean | null>(null);
  /** `visit_verified` already announced this load. Deliberately per load. */
  const verifiedReported = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const { lang, t } = useLanguage();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        const draft = parseAssessmentDraft(parsed);
        if (draft) {
          setScreen(draft.screen);
          setSection(clampSection(draft.section));
          setAnswers(draft.answers);
          setPendingReport(draft.pendingReport);
          setReportReceipt(draft.reportReceipt);
          activeSubmissionId.current = draft.pendingReport?.submissionId ?? null;
          setResumeScreen(draft.resumeScreen ?? (draft.screen === "results" ? "results" : Object.keys(draft.answers).length > 0 ? "quiz" : null));
        }
      }
    } catch {
      setSaveState("unavailable");
    } finally {
      setHydrated(true);
    }
  }, []);

  // DEV SHORTCUT (remove this block + app/devShortcuts.ts to remove entirely):
  // visit /?debug=strategy-gap to jump straight to the results page with a
  // near-perfect answer set that has 1-2 deliberately weak sub-answers in
  // Estratégia, for eyeballing the "high score, not a gap" fix.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("debug") !== "strategy-gap") return;
    setAnswers(buildStrategyGapTestAnswers());
    setResumeScreen("results");
    setScreen("results");
  }, []);

  // The saved snapshot resolves every bilingual string at submit time, so a
  // report captured in Portuguese would stay Portuguese after switching to
  // English. Rebuild it for display only: buildReportSnapshot is deterministic
  // given the same answers, id and timestamp, so this changes the language and
  // nothing else. pendingReport itself is never reassigned -- it is the record
  // of what was actually submitted and hashed.
  const displayReport = useMemo(() => {
    if (!pendingReport) return null;
    return buildReportSnapshot({
      answers: pendingReport.answers,
      participant: pendingReport.participant,
      submissionId: pendingReport.submissionId,
      clientSubmittedAt: pendingReport.clientSubmittedAt,
      // Carried through, never re-measured: this rebuild only changes language,
      // and a draft saved before the field existed has no duration to carry.
      activeSeconds: pendingReport.activeSeconds ?? 0,
      lang,
    });
  }, [pendingReport, lang]);

  // --- Analytics -----------------------------------------------------------
  // Drop-off instrumentation only. It observes state this component already
  // holds, never changes behaviour, and never sends respondent identity.

  const assessmentProgress = useMemo(() => getAssessmentProgress(answers), [answers]);
  // Which named stretches of the questionnaire are finished. Derived from the
  // same helper the sidebar checkmarks use, so a reported section is one the
  // respondent saw tick over.
  const completedSectionIds = useMemo(
    () => SECTIONS.filter(section => getSectionProgress(section, answers).complete).map(section => section.id),
    [answers]
  );
  // These two mirror the render conditions below, so a milestone is reported
  // only when the respondent can actually see that step.
  const showsContactForm = screen === "results" && (!pendingReport || !reportReceipt);
  const showsResults = screen === "results" && Boolean(displayReport) && Boolean(reportReceipt);

  /**
   * Which post this visitor arrived from.
   *
   * Resolved on first use rather than in an effect, so ordering against the
   * milestone effects below cannot leave an event unattributed. A link with UTM
   * parameters is stored, so the attribution survives a later visit that has no
   * query string of its own.
   */
  const getAttribution = useCallback((): Attribution => {
    if (attributionRef.current) return attributionRef.current;
    const fromUrl = parseAttribution(window.location.search);
    if (hasAttribution(fromUrl)) persistAttribution(fromUrl);
    const resolved = resolveAttribution(fromUrl, readStoredAttribution());
    attributionRef.current = resolved;
    return resolved;
  }, []);

  /**
   * Whether this visit has produced verified human interaction.
   *
   * Read from refs at call time rather than from render state, for the same
   * reason attribution is: a gesture need not cause a re-render, so a verdict
   * refreshed by an effect could lag the signal it reports. The empty
   * dependency list keeps this callback's identity stable, so listing it as a
   * dependency below cannot restart the heartbeat timer.
   *
   * Latching here rather than in the observer keeps one pure function deciding
   * the question wherever it is asked.
   */
  const visitorClass = useCallback((): VisitorClass => {
    if (humanVerified.current === null) humanVerified.current = readVisitorClass() === VISITOR_HUMAN;
    if (humanVerified.current) return VISITOR_HUMAN;
    const state = timing.current ?? (timing.current = readTimingState());
    const verdict = classifyVisitor({
      verified: false,
      interacted: interacted.current,
      activeMs: activeMs(state, Date.now()),
    });
    if (verdict === VISITOR_HUMAN) {
      humanVerified.current = true;
      persistVisitorVerified();
    }
    return verdict;
  }, []);

  /**
   * Report a milestone the first time this assessment attempt reaches it.
   *
   * The fired set is remembered in local storage, so resuming a saved draft
   * continues the funnel instead of recounting steps already measured.
   */
  const fireMilestone = useCallback((key: MilestoneKey, params?: Record<string, string | number | boolean>) => {
    const fired = firedMilestones.current ?? new Set(readFiredMilestones());
    firedMilestones.current = fired;
    if (fired.has(key)) return;
    fired.add(key);
    persistFiredMilestones(fired);
    trackEvent(milestoneEventName(key), {
      ...toEventParams(getAttribution()),
      ...toVisitorParams(visitorClass()),
      ...params,
    });
  }, [getAttribution, visitorClass]);

  /**
   * How long this respondent has actually had the assessment in front of them.
   *
   * Reported on every event, which is the whole point: Analytics only banks the
   * time a page reports, and a questionnaire that sends nothing between its
   * first screen and its last would otherwise measure as a few milliseconds.
   */
  const trackedSeconds = useCallback((): number => {
    const state = timing.current ?? (timing.current = readTimingState());
    return activeSeconds(state, Date.now());
  }, []);

  // Start Google Analytics before the draft finishes loading, so standard
  // audience, session, traffic-source, campaign, and device data is collected
  // even for a visitor who leaves without answering anything.
  useEffect(() => {
    initAnalytics();
  }, []);

  // Once per page load rather than once per attempt: a returning respondent
  // opening the assessment again is a new view.
  useEffect(() => {
    if (!hydrated || trackedAssessmentView.current) return;
    trackedAssessmentView.current = true;
    trackEvent("assessment_view", {
      ...toEventParams(getAttribution()),
      // Necessarily unverified on a first visit: this fires on hydration,
      // before interaction is possible. A resumed visit that verified earlier
      // reports human straight away.
      ...toVisitorParams(visitorClass()),
      lang,
      resumed: resumeScreen !== null,
      active_seconds: trackedSeconds(),
    });
  }, [getAttribution, hydrated, lang, resumeScreen, trackedSeconds, visitorClass]);

  /**
   * Run the clock while the page is in the foreground.
   *
   * Hiding the tab banks the stretch and stops counting, so time spent in
   * another window is never charged to the respondent. `pagehide` banks the
   * final stretch, which is the only chance to keep the last stretch of a visit
   * that ends by closing the tab.
   */
  useEffect(() => {
    if (!hydrated) return;
    const now = Date.now();
    let state = timing.current ?? readTimingState();
    if (reportedEngagement.current === null) reportedEngagement.current = state.activeMs;
    if (document.visibilityState === "visible") state = startStretch(state, now);
    timing.current = state;

    const bankNow = () => {
      const current = timing.current;
      if (!current) return;
      timing.current = stopStretch(current, Date.now());
      persistTimingState(timing.current);
    };
    const onVisibility = () => {
      const current = timing.current;
      if (!current) return;
      if (document.visibilityState === "visible") {
        timing.current = startStretch(current, Date.now());
      } else {
        bankNow();
      }
    };

    // A person acted on the page. Registered here because this effect already
    // owns the page's listeners; it shares no event name or handler with the
    // clock above, and detaches itself as soon as it has fired once.
    const stopWatching = interacted.current
      ? () => {}
      : observeTrustedInteraction(() => { interacted.current = true; });

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", bankNow);
    return () => {
      stopWatching();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", bankNow);
      bankNow();
    };
  }, [hydrated]);

  /**
   * What a beat reports, held in a ref rather than in the timer's dependencies.
   *
   * Language and progress change as the respondent works. Listing them as
   * dependencies of the timer below would tear the timer down and start it
   * again on every answer, so a respondent answering faster than one question
   * per interval would never reach a beat -- leaving the most engaged visitors
   * as precisely the ones measured at zero.
   */
  const beatPayload = useRef({ lang, percent: assessmentProgress.percent });
  useEffect(() => {
    beatPayload.current = { lang, percent: assessmentProgress.percent };
  }, [assessmentProgress.percent, lang]);

  /**
   * Report the running total on a fixed cadence.
   *
   * This is what repairs Analytics' own engagement measurement: it banks time
   * against the next event a page sends, so a periodic event turns a silent
   * questionnaire into a measured one. It also stops the clock drifting, since
   * every beat banks the stretch that just elapsed.
   *
   * The first beat comes early, at `FIRST_HEARTBEAT_DELAY_MS`, because a visit
   * that ends before the first report contributes only the few milliseconds
   * between `page_view` and `assessment_view`. Beating on GA4's own
   * engaged-session threshold means a short visit still counts as the time it
   * actually lasted.
   */
  useEffect(() => {
    if (!hydrated) return;
    const beat = () => {
      const current = timing.current;
      if (!current || document.visibilityState !== "visible") return;
      const now = Date.now();
      if (exhausted(current, now)) return;
      timing.current = bankStretch(current, now);
      persistTimingState(timing.current);
      const { lang: beatLang, percent } = beatPayload.current;
      const total = activeMs(timing.current, now);
      const engagement = engagementDeltaMs(total, reportedEngagement.current ?? 0);
      reportedEngagement.current = total;
      const visitor = visitorClass();
      // Announced from the beat rather than from the observer because both
      // halves of the verdict are only ever true together here: a gesture
      // cannot verify a visit before the dwell threshold, and the first beat
      // lands exactly on it. A gesture arriving later is picked up by the next
      // beat, which is late by at most one interval and costs nothing in a
      // figure that counts users rather than moments.
      if (shouldReportVerification(visitor, verifiedReported.current)) {
        verifiedReported.current = true;
        trackEvent(VISIT_VERIFIED_EVENT, {
          ...toEventParams(getAttribution()),
          ...toVisitorParams(visitor),
          lang: beatLang,
          active_seconds: activeSeconds(timing.current, now),
        });
      }
      trackEvent(HEARTBEAT_EVENT, {
        ...toEventParams(getAttribution()),
        ...toVisitorParams(visitor),
        lang: beatLang,
        // The parameter GA4 builds "average engagement time" from. Reported
        // here rather than left to gtag, which measures nothing unless the
        // document holds focus.
        //
        // Routed by verdict, so only a verified human's time reaches it. An
        // unverified visit still reports the figure, under a name of our own,
        // because no label can pull a value back out of a built-in metric.
        ...toEngagementParams(visitor, engagement),
        active_seconds: activeSeconds(timing.current, now),
        progress_percent: percent,
      });
    };
    const lead = window.setTimeout(beat, FIRST_HEARTBEAT_DELAY_MS);
    const cadence = window.setInterval(beat, HEARTBEAT_INTERVAL_MS);
    return () => {
      window.clearTimeout(lead);
      window.clearInterval(cadence);
    };
  }, [getAttribution, hydrated, visitorClass]);

  useEffect(() => {
    if (!hydrated) return;
    const fired = firedMilestones.current ?? new Set(readFiredMilestones());
    firedMilestones.current = fired;
    const due = pendingMilestones({
      answered: assessmentProgress.answered,
      percent: assessmentProgress.percent,
      complete: assessmentProgress.complete,
      completedSectionIds,
      onContactForm: showsContactForm,
      resultsVisible: showsResults,
    }, fired);
    for (const key of due) {
      const sectionId = parseSectionMilestoneKey(key);
      fireMilestone(key, {
        lang,
        progress_percent: assessmentProgress.percent,
        questions_answered: assessmentProgress.answered,
        // Time-to-milestone: how long the respondent had been working when this
        // step was reached, which is what turns the funnel into a drop-off
        // story rather than a set of counts.
        active_seconds: trackedSeconds(),
        // Every section reports under one event name, so these parameters are
        // what separates "finished Dados" from "finished Estrategia" in GA4.
        ...(sectionId === null ? {} : {
          section_id: sectionId,
          section_index: SECTIONS.findIndex(section => section.id === sectionId),
        }),
      });
    }
  }, [assessmentProgress, completedSectionIds, fireMilestone, hydrated, lang, showsContactForm, showsResults, trackedSeconds]);

  const reportSubmitError = reportSubmitErrorCode === null
    ? null
    : reportSubmitErrorCode === LOCAL_SAVE_ERROR
      ? t.results.identityLocalSaveError
      : t.results.submitErrors[reportSubmitErrorCode] ?? t.results.identitySubmitError;

  const buildDraft = useCallback((overrides: Partial<AssessmentDraftState> = {}): AssessmentDraftV2 => buildAssessmentDraft({
    screen,
    resumeScreen,
    section,
    answers,
    pendingReport,
    reportReceipt,
  }, overrides), [answers, pendingReport, reportReceipt, resumeScreen, screen, section]);

  const persistDraft = useCallback((draft: AssessmentDraftV2): boolean => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setSaveState("saved");
      return true;
    } catch {
      setSaveState("unavailable");
      return false;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState(current => current === "unavailable" ? current : "saving");
    const timeout = window.setTimeout(() => {
      persistDraft(buildDraft());
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [buildDraft, hydrated, persistDraft]);

  const persistNow = useCallback(() => {
    persistDraft(buildDraft());
  }, [buildDraft, persistDraft]);

  const saveReport = useCallback(async (snapshot: ReportSnapshot) => {
    setReportSubmitState("saving");
    setReportSubmitErrorCode(null);

    const pendingDraft = buildDraft({ pendingReport: snapshot, reportReceipt: null });
    if (!persistDraft(pendingDraft)) {
      setReportSubmitErrorCode(LOCAL_SAVE_ERROR);
      setReportSubmitState("failed");
      return;
    }

    try {
      const receipt = await submitReportSnapshot(snapshot);
      if (activeSubmissionId.current !== snapshot.submissionId) return;
      setReportReceipt(receipt);
      persistDraft(buildDraft({ pendingReport: snapshot, reportReceipt: receipt }));
      setReportSubmitState("idle");
    } catch (error) {
      if (activeSubmissionId.current !== snapshot.submissionId) return;
      const code = error instanceof ReportSubmissionError ? error.code : "unknown_error";
      if (getReportSubmissionRecovery(error) === "edit") {
        activeSubmissionId.current = null;
        resumedPendingReport.current = false;
        setPendingReport(null);
        setReportReceipt(null);
        persistDraft(buildDraft({ pendingReport: null, reportReceipt: null }));
      }
      setReportSubmitErrorCode(code);
      setReportSubmitState("failed");
    }
  }, [buildDraft, persistDraft]);

  useEffect(() => {
    if (!hydrated || !pendingReport || reportReceipt || reportSubmitState !== "idle" || resumedPendingReport.current) return;
    resumedPendingReport.current = true;
    activeSubmissionId.current = pendingReport.submissionId;
    void saveReport(pendingReport);
  }, [hydrated, pendingReport, reportReceipt, reportSubmitState, saveReport]);

  const scrollToTop = useCallback(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousBehavior;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousBehavior;
  }, [screen, section]);

  const goTo = useCallback((nextScreen: AppScreen) => {
    if (nextScreen === "quiz") setResumeScreen("quiz");
    if (nextScreen === "results") setResumeScreen("results");
    setScreen(nextScreen);
    scrollToTop();
  }, [scrollToTop]);

  const handleAnswer = useCallback((qid: string, value: number | number[] | string | -1) => {
    activeSubmissionId.current = null;
    resumedPendingReport.current = false;
    setResumeScreen("quiz");
    setPendingReport(null);
    setReportReceipt(null);
    setReportSubmitState("idle");
    setReportSubmitErrorCode(null);
    setAnswers(previous => {
      const next = clearDependentAnswers(qid, previous);
      if (value === -1) {
        delete next[qid];
      } else {
        next[qid] = value;
      }
      return next;
    });
  }, []);

  const restart = useCallback(() => {
    activeSubmissionId.current = null;
    resumedPendingReport.current = false;
    setResumeScreen(null);
    setAnswers({});
    setPendingReport(null);
    setReportReceipt(null);
    setReportSubmitState("idle");
    setReportSubmitErrorCode(null);
    setSection(0);
    firedMilestones.current = null;
    clearFiredMilestones();
    timing.current = startStretch({ activeMs: 0, since: null }, Date.now());
    clearTimingState();
    // The clock restarts from zero, so the engagement watermark must too. Left
    // standing, it would swallow every beat until the new clock passed the
    // total banked before the restart.
    reportedEngagement.current = 0;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setSaveState("idle");
    } catch {
      setSaveState("unavailable");
    }
    goTo("quiz");
  }, [goTo]);

  /** Navbar's results-screen action: back to question one, answers intact. */
  const backToStart = useCallback(() => {
    setSection(0);
    goTo("quiz");
  }, [goTo]);

  const handleReportIdentity = useCallback((participant: ParticipantIdentity) => {
    const snapshot = buildReportSnapshot({
      answers,
      participant,
      submissionId: crypto.randomUUID(),
      clientSubmittedAt: new Date().toISOString(),
      activeSeconds: trackedSeconds(),
      lang,
    });
    activeSubmissionId.current = snapshot.submissionId;
    resumedPendingReport.current = true;
    setPendingReport(snapshot);
    setReportReceipt(null);
    // The form passed validation. Deliberately carries no identity fields.
    fireMilestone("contact_info_submitted", { lang, active_seconds: trackedSeconds() });
    void saveReport(snapshot);
  }, [answers, fireMilestone, lang, saveReport, trackedSeconds]);

  const retryReport = useCallback(() => {
    if (!pendingReport) return;
    activeSubmissionId.current = pendingReport.submissionId;
    void saveReport(pendingReport);
  }, [pendingReport, saveReport]);

  if (!hydrated) {
    return <div className="loading-screen" aria-label={t.loading} />;
  }

  const sectionLabel = getSections(lang)[section]?.title ?? t.landing.fallbackSectionTitle;

  return (
    <div className="app-shell">
      <Navbar
        screen={screen}
        sectionLabel={sectionLabel}
        saveState={saveState}
        reportConfirmed={Boolean(reportReceipt)}
        onSave={persistNow}
        onBackToStart={backToStart}
      />

      <main className="page-content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {screen === "quiz" && (
              <QuizScreen
                section={section}
                answers={answers}
                saveState={saveState}
                onAnswer={handleAnswer}
                onSectionSelect={nextSection => {
                  setSection(nextSection);
                  scrollToTop();
                }}
                onBack={() => {
                  if (section === 0) return;
                  setSection(current => current - 1);
                  scrollToTop();
                }}
                onNext={() => {
                  if (section === SECTIONS.length - 1) {
                    goTo("results");
                    return;
                  }
                  setSection(current => current + 1);
                  scrollToTop();
                }}
              />
            )}

            {screen === "results" && (!pendingReport || !reportReceipt) && (
              <ReportIdentityGate
                pendingReport={pendingReport}
                submitState={reportSubmitState}
                errorMessage={reportSubmitError}
                onSubmit={handleReportIdentity}
                onRetry={retryReport}
              />
            )}

            {screen === "results" && displayReport && reportReceipt && (
              <ResultsScreen snapshot={displayReport} onRestart={restart} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
