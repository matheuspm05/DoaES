import { cloneElement, useId } from "react";

export function Field({ label, hint, children, className = "" }) {
  const fieldId = useId();
  return (
    <div className={`field ${className}`}>
      <label htmlFor={fieldId}>{label}</label>
      {cloneElement(children, {
        id: fieldId,
        "aria-describedby": hint ? `${fieldId}-hint` : undefined,
      })}
      {hint && <small id={`${fieldId}-hint`}>{hint}</small>}
    </div>
  );
}
