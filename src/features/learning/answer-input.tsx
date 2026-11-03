"use client";
import type { Answer, PublicQuestion } from "./scoring";
export function AnswerInput({
  question: q,
  value,
  onChange,
  disabled = false,
}: {
  question: PublicQuestion;
  value: Answer;
  onChange: (a: Answer) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend>Your answer</legend>
      {q.options ? (
        q.options.map((option, i) => (
          <label className="answer-option" key={i}>
            <input
              type={q.kind === "multiple" ? "checkbox" : "radio"}
              name={q.id}
              checked={
                q.kind === "multiple"
                  ? Array.isArray(value) && value.includes(i)
                  : value === String(i)
              }
              onChange={(e) =>
                onChange(
                  q.kind === "multiple"
                    ? e.target.checked
                      ? [...(Array.isArray(value) ? value : []), i]
                      : (Array.isArray(value) ? value : []).filter(
                          (n) => n !== i,
                        )
                    : String(i),
                )
              }
            />
            <span>{option}</span>
          </label>
        ))
      ) : (
        <label>
          Numerical value
          <input
            type="number"
            step={q.kind === "integer" ? "1" : "any"}
            value={
              typeof value === "string" || typeof value === "number"
                ? value
                : ""
            }
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      )}
    </fieldset>
  );
}
