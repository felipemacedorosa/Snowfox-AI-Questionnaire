"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LandingScreen } from "@/components/landing/LandingScreen";
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
import { type AnswerRecord, SECTIONS, clearDependentAnswers, getSections } from "./data";
import { useLanguage } from "./LanguageContext";
import { buildReportSnapshot, type ParticipantIdentity, type ReportSnapshot } from "./reportSnapshot";
import { getReportSubmissionRecovery, ReportSubmissionError, submitReportSnapshot } from "./reportSubmission";
// DEV SHORTCUT (remove with app/devShortcuts.ts): see effect below.
import { buildStrategyGapTestAnswers } from "./devShortcuts";

const STORAGE_KEY = "snowfox-ai-assessment-v1";

function clampSection(section: number) {
  return Math.min(Math.max(Math.round(section), 0), SECTIONS.length - 1);
}

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [section, setSection] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord>({});
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [resumeScreen, setResumeScreen] = useState<"quiz" | "results" | null>(null);
  const [pendingReport, setPendingReport] = useState<ReportSnapshot | null>(null);
  const [reportReceipt, setReportReceipt] = useState<ReportSubmissionReceipt | null>(null);
  const [reportSubmitState, setReportSubmitState] = useState<ReportSubmitState>("idle");
  const [reportSubmitError, setReportSubmitError] = useState<string | null>(null);
  const activeSubmissionId = useRef<string | null>(null);
  const resumedPendingReport = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const { lang, t } = useLanguage();

  const draftExists = useMemo(
    () => resumeScreen !== null || Object.keys(answers).length > 0 || screen === "results",
    [answers, resumeScreen, screen]
  );

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
    setReportSubmitError(null);

    const pendingDraft = buildDraft({ pendingReport: snapshot, reportReceipt: null });
    if (!persistDraft(pendingDraft)) {
      setReportSubmitError(t.results.identityLocalSaveError);
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
      const message = error instanceof ReportSubmissionError
        ? error.message
        : t.results.identitySubmitError;
      if (getReportSubmissionRecovery(error) === "edit") {
        activeSubmissionId.current = null;
        resumedPendingReport.current = false;
        setPendingReport(null);
        setReportReceipt(null);
        persistDraft(buildDraft({ pendingReport: null, reportReceipt: null }));
      }
      setReportSubmitError(message);
      setReportSubmitState("failed");
    }
  }, [buildDraft, persistDraft, t.results.identityLocalSaveError, t.results.identitySubmitError]);

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
    setReportSubmitError(null);
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

  const startFresh = useCallback(() => {
    activeSubmissionId.current = null;
    resumedPendingReport.current = false;
    setResumeScreen("quiz");
    setAnswers({});
    setPendingReport(null);
    setReportReceipt(null);
    setReportSubmitState("idle");
    setReportSubmitError(null);
    setSection(0);
    goTo("quiz");
  }, [goTo]);

  const restart = useCallback(() => {
    activeSubmissionId.current = null;
    resumedPendingReport.current = false;
    setResumeScreen(null);
    setAnswers({});
    setPendingReport(null);
    setReportReceipt(null);
    setReportSubmitState("idle");
    setReportSubmitError(null);
    setSection(0);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setSaveState("idle");
    } catch {
      setSaveState("unavailable");
    }
    goTo("landing");
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
    void saveReport(snapshot);
  }, [answers, lang, saveReport]);

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
        onNavigate={goTo}
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
            {screen === "landing" && (
              <LandingScreen
                hasDraft={draftExists}
                savedScreen={resumeScreen}
                savedSection={section}
                reportConfirmed={Boolean(reportReceipt)}
                onStart={startFresh}
                onResume={() => goTo(resumeScreen === "results" ? "results" : "quiz")}
                onReset={restart}
              />
            )}

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
                  if (section === 0) {
                    goTo("landing");
                    return;
                  }
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

            {screen === "results" && pendingReport && reportReceipt && (
              <ResultsScreen snapshot={pendingReport} onRestart={restart} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
