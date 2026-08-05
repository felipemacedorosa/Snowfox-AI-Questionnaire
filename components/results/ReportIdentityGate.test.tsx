import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/app/LanguageContext";
import { ReportIdentityGate } from "./ReportIdentityGate";

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
    expect(markup).not.toContain('type="checkbox"');
    expect(markup).not.toContain("Concordo que a Snowfox armazene");
  });
});
