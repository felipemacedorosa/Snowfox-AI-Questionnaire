import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuestionContext } from "./QuestionContext";

describe("QuestionContext", () => {
  it("renders explanatory copy directly below a question", () => {
    expect(renderToStaticMarkup(<QuestionContext text="Valor econômico explicado" />)).toBe(
      '<p class="question-context">Valor econômico explicado</p>'
    );
  });

  it("renders nothing when no explanation is configured", () => {
    expect(renderToStaticMarkup(<QuestionContext />)).toBe("");
  });
});
