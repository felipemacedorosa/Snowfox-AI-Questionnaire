"use client";

import { useState, useCallback } from "react";
import { BeamsBackground } from "@/components/ui/beams-background";
import { Navbar } from "@/components/Navbar";
import { QuizScreen } from "@/components/quiz/QuizScreen";
import { ResultsScreen } from "@/components/results/ResultsScreen";
import { SECTIONS, AnswerRecord, clearDependentAnswers } from "./data";

type Screen = "quiz" | "results";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("quiz");
  const [section, setSection] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord>({});

  const handleAnswer = useCallback((qid: string, val: number | number[] | string | -1) => {
    setAnswers(prev => {
      if (val === -1) {
        const next = clearDependentAnswers(qid, prev);
        delete next[qid];
        return next;
      }
      const next = clearDependentAnswers(qid, prev);
      next[qid] = val as number | number[] | string;
      return next;
    });
  }, []);

  function goTo(s: Screen) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setScreen(s);
  }

  return (
    <>
      <div
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}
      >
        <BeamsBackground intensity="strong" />
      </div>

      <div className="relative min-h-screen" style={{ zIndex: 10 }}>
        <Navbar screen={screen} onSave={() => {}} />

        <div className="flex justify-center pt-16">
          <div className="w-full px-5 py-9 pb-[72px]" style={{ maxWidth: "1100px" }}>

            {screen === "quiz" && (
              <QuizScreen
                key={section}
                section={section}
                answers={answers}
                onAnswer={handleAnswer}
                onBack={() => section === 0 ? undefined : setSection(s => s - 1)}
                onNext={() => {
                  if (section === SECTIONS.length - 1) goTo("results");
                  else setSection(s => s + 1);
                }}
              />
            )}

            {screen === "results" && (
              <ResultsScreen
                answers={answers}
                onRestart={() => {
                  setAnswers({});
                  setSection(0);
                  goTo("quiz");
                }}
              />
            )}

          </div>
        </div>
      </div>
    </>
  );
}
