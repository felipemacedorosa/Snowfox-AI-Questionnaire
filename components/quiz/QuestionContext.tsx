export function QuestionContext({ text }: { text?: string }) {
  return text ? <p className="question-context">{text}</p> : null;
}
