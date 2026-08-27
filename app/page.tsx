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
  HEARTBEAT_INTERVAL_MS,
  activeSeconds,
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
    trackEvent(milestoneEventName(key), { ...toEventParams(getAttribution()), ...params });
  }, [getAttribution]);

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
      lang,
      resumed: resumeScreen !== null,
      active_seconds: trackedSeconds(),
    });
  }, [getAttribution, hydrated, lang, resumeScreen, trackedSeconds]);

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

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", bankNow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", bankNow);
      bankNow();
    };
  }, [hydrated]);

  /**
   * Report the running total on a fixed cadence.
   *
   * This is what repairs Analytics' own engagement measurement: it banks time
   * against the next event a page sends, so a periodic event turns a silent
   * questionnaire into a measured one. It also stops the clock drifting, since
   * every beat banks the stretch that just elapsed.
   */
  useEffect(() => {
    if (!hydrated) return;
    const beat = window.setInterval(() => {
      const current = timing.current;
      if (!current || document.visibilityState !== "visible") return;
      const now = Date.now();
      if (exhausted(current, now)) return;
      timing.current = bankStretch(current, now);
      persistTimingState(timing.current);
      trackEvent(HEARTBEAT_EVENT, {
        ...toEventParams(getAttribution()),
        lang,
        active_seconds: activeSeconds(timing.current, now),
        progress_percent: assessmentProgress.percent,
      });
    }, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(beat);
  }, [assessmentProgress.percent, getAttribution, hydrated, lang]);

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
