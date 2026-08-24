"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, RotateCcw, Save } from "lucide-react";
import { useLanguage } from "@/app/LanguageContext";
import {
  normalizeParticipant,
  ParticipantInput,
  ParticipantValidationErrors,
  validateParticipant,
} from "@/app/reportSubmission";
import { ParticipantIdentity, ReportSnapshot } from "@/app/reportSnapshot";

export type ReportSubmitState = "idle" | "saving" | "failed";

export function ReportIdentityGate({
  pendingReport,
  submitState,
  errorMessage,
  onSubmit,
  onRetry,
}: {
  pendingReport: ReportSnapshot | null;
  submitState: ReportSubmitState;
  errorMessage: string | null;
  onSubmit: (participant: ParticipantIdentity) => void;
  onRetry: () => void;
}) {
  const { lang, t } = useLanguage();
  const [name, setName] = useState(pendingReport?.participant.name ?? "");
  const [email, setEmail] = useState(pendingReport?.participant.email ?? "");
  const [companyName, setCompanyName] = useState(pendingReport?.participant.companyName ?? "");
  const [jobTitle, setJobTitle] = useState(pendingReport?.participant.jobTitle ?? "");
  const [errors, setErrors] = useState<ParticipantValidationErrors>({});
  const locked = pendingReport !== null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked) {
      onRetry();
      return;
    }
    const input: ParticipantInput = { name, email, companyName, jobTitle };
    const nextErrors = validateParticipant(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(normalizeParticipant(input));
  };

  const fieldError = (field: keyof ParticipantValidationErrors) => {
    if (!errors[field]) return null;
    if (lang === "pt") return errors[field];
    const english: Record<keyof ParticipantValidationErrors, string> = {
      name: "Enter your name.",
      email: "Enter a valid email address.",
      companyName: "Enter your company name.",
      jobTitle: "Enter your job title.",
    };
    return english[field];
  };

  return (
    <section className="report-identity page-frame" aria-labelledby="report-identity-title">
      <div className="report-identity-copy">
        <span className="section-kicker"><span className="kicker-line" /> {t.results.identityKicker}</span>
        <h1 id="report-identity-title">{t.results.identityTitle}</h1>
        <p>{t.results.identityLede}</p>
      </div>
      <form className="report-identity-form" onSubmit={handleSubmit} noValidate>
        <label>
          <span>{t.results.identityName}</span>
          <input name="name" type="text" autoComplete="name" maxLength={120} disabled={locked} value={name} onChange={event => setName(event.target.value)} aria-invalid={Boolean(errors.name)} />
          {fieldError("name") && <small role="alert">{fieldError("name")}</small>}
        </label>
        <label>
          <span>{t.results.identityEmail}</span>
          <input name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} disabled={locked} value={email} onChange={event => setEmail(event.target.value)} aria-invalid={Boolean(errors.email)} />
          {fieldError("email") && <small role="alert">{fieldError("email")}</small>}
        </label>
        <label>
          <span>{t.results.identityCompany}</span>
          <input name="companyName" type="text" autoComplete="organization" maxLength={120} disabled={locked} value={companyName} onChange={event => setCompanyName(event.target.value)} aria-invalid={Boolean(errors.companyName)} />
          {fieldError("companyName") && <small role="alert">{fieldError("companyName")}</small>}
        </label>
        <label>
          <span>{t.results.identityJobTitle}</span>
          <input name="jobTitle" type="text" autoComplete="organization-title" maxLength={120} disabled={locked} value={jobTitle} onChange={event => setJobTitle(event.target.value)} aria-invalid={Boolean(errors.jobTitle)} />
          {fieldError("jobTitle") && <small role="alert">{fieldError("jobTitle")}</small>}
        </label>
        {errorMessage && <div className="report-submit-error" role="alert">{errorMessage}</div>}
        <button className="button-primary report-submit-button" type="submit" disabled={submitState === "saving"} aria-live="polite">
          {submitState === "saving"
            ? <><LoaderCircle className="spin" size={17} aria-hidden="true" /> {t.results.identitySaving}</>
            : locked
              ? <><RotateCcw size={17} aria-hidden="true" /> {t.results.identityRetry}</>
              : <><Save size={17} aria-hidden="true" /> {t.results.identitySubmit}</>}
        </button>
      </form>
    </section>
  );
}
