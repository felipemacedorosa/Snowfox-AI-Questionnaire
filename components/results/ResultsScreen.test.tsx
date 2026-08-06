import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/app/LanguageContext";
import { buildReportSnapshot } from "@/app/reportSnapshot";
import { ResultsScreen } from "./ResultsScreen";

describe("ResultsScreen communication", () => {
  it("presents weak-answer activities inside the existing action-plan chapter", () => {
    const snapshot = buildReportSnapshot({
      answers: {
        dados_q1: 1,
        dados_q2: 1,
        dados_q4: 1,
        est_q1: 3,
        est_q1b: 3,
        pess_q4: 1,
        pess_q6: 1,
        gov_q1: 1,
        gov_q2: 1,
        tec_q1: 1,
        tec_q1b: 1,
      },
      participant: {
        name: "Report Render Test",
        email: "report-render@example.com",
        storageAcknowledged: true,
      },
      submissionId: "4b4d9728-6f1d-4f9d-b3fc-ff824d856e25",
      clientSubmittedAt: "2026-08-06T12:00:00.000Z",
    });

    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <ResultsScreen snapshot={snapshot} onRestart={() => undefined} />
      </LanguageProvider>,
    );

    expect(markup).toContain("respostas com menor pontuação");
    expect(markup).toContain("Atividade recomendada a partir do diagnóstico");
    expect(markup).not.toContain("Prioridades para avançar");
    expect(markup).toContain('id="action-plan"');
    expect(markup).not.toContain("opportunity-track-data-foundation");
    expect(markup).toContain("opportunity-track-automation-agents");
  });
});
