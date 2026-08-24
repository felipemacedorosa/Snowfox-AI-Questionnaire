import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/app/LanguageContext";
import { buildReportSnapshot } from "@/app/reportSnapshot";
import { ReportIdentityGate } from "./ReportIdentityGate";

const pendingSnapshot = buildReportSnapshot({
  answers: { dados_q1: 2, est_q1: 3, est_q1b: 2, tec_q1: 1, tec_q1b: 2 },
  participant: {
    name: "Gabi Silva",
    email: "gabi@example.com",
    companyName: "Metalurgica Aurora",
    jobTitle: "Gerente de Operações",
    storageAcknowledged: true,
  },
  submissionId: "4b4d9728-6f1d-4f9d-b3fc-ff824d856e25",
  clientSubmittedAt: "2026-08-04T20:00:00.000Z",
});

describe("ReportIdentityGate", () => {
  it("asks for identity without rendering a storage checkbox", () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <ReportIdentityGate
          pendingReport={null}
          submitState="idle"
          errorMessage={null}
          onSubmit={() => undefined}
          onRetry={() => undefined}
        />
      </LanguageProvider>
    );

    expect(markup).toContain('name="name"');
    expect(markup).toContain('name="email"');
    expect(markup).toContain('name="companyName"');
    expect(markup).toContain('name="jobTitle"');
    expect(markup).not.toContain('type="checkbox"');
    expect(markup).not.toContain("Concordo que a Snowfox armazene");
  });

  it("locks every identity field once a report is pending", () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <ReportIdentityGate
          pendingReport={pendingSnapshot}
          submitState="failed"
          errorMessage="Falha temporária."
          onSubmit={() => undefined}
          onRetry={() => undefined}
        />
      </LanguageProvider>
    );

    expect(markup.match(/disabled=""/g) ?? []).toHaveLength(4);
    expect(markup).toContain("Metalurgica Aurora");
    expect(markup).toContain("Gerente de Operações");
  });
});
