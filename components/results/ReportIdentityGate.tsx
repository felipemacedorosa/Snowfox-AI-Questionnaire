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
  const [storageAcknowledged, setStorageAcknowledged] = useState(pendingReport?.participant.storageAcknowledged ?? false);
  const [errors, setErrors] = useState<ParticipantValidationErrors>({});
  const locked = pendingReport !== null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked) {
      onRetry();
      return;
    }
    const input: ParticipantInput = { name, email, storageAcknowledged };
    const nextErrors = validateParticipant(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(normalizeParticipant(input));
  };

  const fieldError = (field: keyof ParticipantValidationErrors) => {
    if (!errors[field]) return null;
    if (lang === "pt") return errors[field];
    return field === "name"
      ? "Enter your name."
      : field === "email"
        ? "Enter a valid email address."
        : "Confirm storage to generate the report.";
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
        <label className="report-storage-acknowledgement">
          <input type="checkbox" checked={storageAcknowledged} disabled={locked} onChange={event => setStorageAcknowledged(event.target.checked)} />
          <span>{t.results.identityAcknowledgement}</span>
        </label>
        {fieldError("storageAcknowledged") && <small role="alert">{fieldError("storageAcknowledged")}</small>}
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
