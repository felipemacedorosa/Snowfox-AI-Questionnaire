import { describe, expect, it } from "vitest";
import {
  EMPTY_ATTRIBUTION,
  MAX_VALUE_LENGTH,
  hasAttribution,
  parseAttribution,
  parseStoredAttribution,
  resolveAttribution,
  toEventParams,
  type Attribution,
} from "./attribution";

/** The link shape the marketing posts actually use. */
const POST_LINK = "?utm_source=linkedin&utm_medium=social&utm_campaign=readiness&utm_content=post-assess-033&utm_term=governanca";

const fromPost: Attribution = {
  postId: "post-assess-033",
  source: "linkedin",
  medium: "social",
  campaign: "readiness",
  term: "governanca",
};

describe("parseAttribution", () => {
  it("reads every UTM parameter from a post link", () => {
    expect(parseAttribution(POST_LINK)).toEqual(fromPost);
  });

  it("identifies the post through utm_content", () => {
    expect(parseAttribution("?utm_content=post-assess-041").postId).toBe("post-assess-041");
  });

  it("returns nothing for a link with no campaign parameters", () => {
    expect(parseAttribution("")).toEqual(EMPTY_ATTRIBUTION);
    expect(parseAttribution("?debug=strategy-gap")).toEqual(EMPTY_ATTRIBUTION);
  });

  it("keeps unrelated query parameters out of the attribution", () => {
    // A link may carry parameters that are nobody's business to measure.
    const parsed = parseAttribution("?utm_content=post-9&email=someone%40example.com&token=abc");
    expect(parsed).toEqual({ ...EMPTY_ATTRIBUTION, postId: "post-9" });
    expect(JSON.stringify(parsed)).not.toContain("example.com");
  });

  it("tolerates a partially filled link", () => {
    expect(parseAttribution("?utm_source=newsletter")).toEqual({ ...EMPTY_ATTRIBUTION, source: "newsletter" });
  });

  it("trims and clamps values to what Analytics accepts", () => {
    expect(parseAttribution("?utm_content=%20%20post-7%20%20").postId).toBe("post-7");
    const long = "x".repeat(MAX_VALUE_LENGTH + 50);
    expect(parseAttribution(`?utm_content=${long}`).postId).toHaveLength(MAX_VALUE_LENGTH);
  });

  it("strips control characters out of a hand-built link", () => {
    expect(parseAttribution("?utm_content=post%00-%1F7").postId).toBe("post-7");
  });
});

describe("resolveAttribution", () => {
  it("credits the link the visitor actually arrived on", () => {
    const stored = { ...EMPTY_ATTRIBUTION, postId: "older-post" };
    expect(resolveAttribution(fromPost, stored)).toEqual(fromPost);
  });

  it("keeps the original post when a later visit has no parameters", () => {
    // The respondent resumes from a bookmark: the post still earned this funnel.
    expect(resolveAttribution(EMPTY_ATTRIBUTION, fromPost)).toEqual(fromPost);
  });

  it("stays unattributed when neither the link nor storage knows the source", () => {
    expect(resolveAttribution(EMPTY_ATTRIBUTION, null)).toEqual(EMPTY_ATTRIBUTION);
    expect(resolveAttribution(EMPTY_ATTRIBUTION, EMPTY_ATTRIBUTION)).toEqual(EMPTY_ATTRIBUTION);
  });
});

describe("toEventParams", () => {
  it("prefixes every field so it cannot collide with GA4's own campaign fields", () => {
    expect(toEventParams(fromPost)).toEqual({
      post_id: "post-assess-033",
      post_source: "linkedin",
      post_medium: "social",
      post_campaign: "readiness",
      post_term: "governanca",
    });
  });

  it("omits fields the link did not set", () => {
    expect(toEventParams({ ...EMPTY_ATTRIBUTION, postId: "post-3" })).toEqual({ post_id: "post-3" });
  });

  it("sends nothing at all for an unattributed visit", () => {
    expect(toEventParams(EMPTY_ATTRIBUTION)).toEqual({});
  });
});

describe("parseStoredAttribution", () => {
  it("round-trips a stored attribution", () => {
    expect(parseStoredAttribution(JSON.parse(JSON.stringify(fromPost)))).toEqual(fromPost);
  });

  it("discards malformed storage", () => {
    expect(parseStoredAttribution(null)).toBeNull();
    expect(parseStoredAttribution("post-1")).toBeNull();
    expect(parseStoredAttribution({})).toBeNull();
    expect(parseStoredAttribution({ postId: 7 })).toBeNull();
    expect(parseStoredAttribution(EMPTY_ATTRIBUTION)).toBeNull();
  });

  it("recovers the fields it can from a partially valid record", () => {
    expect(parseStoredAttribution({ postId: "post-5", source: 42 }))
      .toEqual({ ...EMPTY_ATTRIBUTION, postId: "post-5" });
  });
});

describe("hasAttribution", () => {
  it("separates an attributed visit from an unattributed one", () => {
    expect(hasAttribution(EMPTY_ATTRIBUTION)).toBe(false);
    expect(hasAttribution({ ...EMPTY_ATTRIBUTION, term: "governanca" })).toBe(true);
  });
});
