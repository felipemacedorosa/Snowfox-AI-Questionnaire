"use client";

import type { Analytics } from "firebase/analytics";

/**
 * Firebase web configuration for the AI readiness assessment.
 *
 * These values are not secrets: a web app's Firebase config is served inside
 * the client bundle no matter where it is stored, and Google documents it as
 * public. Access is controlled by the Firebase project's own rules, not by
 * hiding this object.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAOkCU_8vsP0sPIM6pWXZUmk5gZ-INCg64",
  authDomain: "campanha-readiness-assessment.firebaseapp.com",
  projectId: "campanha-readiness-assessment",
  storageBucket: "campanha-readiness-assessment.firebasestorage.app",
  messagingSenderId: "912914732702",
  appId: "1:912914732702:web:7fc26df6fec9449a4c8d8f",
  measurementId: "G-E8SG75CGDK",
};

/** Resolved once, then reused, so the SDK is loaded and initialized a single time. */
let analyticsPromise: Promise<Analytics | null> | null = null;

/**
 * Load Firebase Analytics on first use.
 *
 * Analytics is optional instrumentation and must never be able to break the
 * assessment, so every failure path resolves to `null` rather than rejecting.
 *
 * The SDK is imported dynamically for two reasons: `firebase/analytics` reads
 * browser globals and this app is prerendered to static HTML by Node at build
 * time, and a deferred import keeps the SDK out of the critical path for the
 * first question.
 */
function loadAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (analyticsPromise) return analyticsPromise;

  analyticsPromise = (async () => {
    try {
      const [{ getApp, getApps, initializeApp }, { getAnalytics, isSupported }] = await Promise.all([
        import("firebase/app"),
        import("firebase/analytics"),
      ]);

      // Browsers without cookies, IndexedDB, or in some privacy modes report
      // Analytics as unsupported. Treat that as "no measurement", not an error.
      if (!(await isSupported())) return null;

      // Reuse an already initialized app instead of creating a second one.
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

      return getAnalytics(app);
    } catch {
      return null;
    }
  })();

  return analyticsPromise;
}

/**
 * Start Analytics so Google Analytics collects the standard session, page
 * view, traffic source, campaign, and device signals even for a visitor who
 * never answers a question.
 */
export function initAnalytics(): void {
  void loadAnalytics();
}

/**
 * Report one funnel event. Fire-and-forget by design: the caller is inside the
 * assessment's render path and must not await or fail on instrumentation.
 *
 * Never pass respondent identity here. Parameters are limited to anonymous
 * progress signals.
 */
export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  void (async () => {
    try {
      const analytics = await loadAnalytics();
      if (!analytics) return;
      const { logEvent } = await import("firebase/analytics");
      logEvent(analytics, name, params);
    } catch {
      // A dropped event is never a user-facing problem; stay silent.
    }
  })();
}
