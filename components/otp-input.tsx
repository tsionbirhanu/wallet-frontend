"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

const LENGTH = 6;

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired once the last digit lands, so the caller can submit immediately. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  label: string;
  describedBy?: string;
}

/**
 * Six single-character boxes behaving as one field: digits only, auto-advance,
 * backspace steps back, arrows move, and a pasted code fills every box.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
  label,
  describedBy,
}: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const focusAt = (index: number) => {
    const target = inputs.current[Math.max(0, Math.min(index, LENGTH - 1))];
    target?.focus();
    target?.select();
  };

  const commit = (next: string) => {
    const trimmed = next.slice(0, LENGTH);
    onChange(trimmed);
    if (trimmed.length === LENGTH) onComplete?.(trimmed);
    return trimmed;
  };

  const handleInput = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;

    // Typing past the end of the entered code always appends, so the boxes fill
    // left to right no matter which one has focus.
    const start = Math.min(index, value.length);
    const next = (value.slice(0, start) + digits + value.slice(start + digits.length)).slice(
      0,
      LENGTH,
    );
    const committed = commit(next);
    focusAt(Math.min(start + digits.length, committed.length));
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (value[index]) {
        commit(value.slice(0, index) + value.slice(index + 1));
        focusAt(index);
      } else if (index > 0) {
        commit(value.slice(0, index - 1) + value.slice(index));
        focusAt(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    event.preventDefault();
    const committed = commit(digits);
    focusAt(committed.length);
  };

  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      className="flex justify-between gap-2 sm:gap-2.5"
    >
      {Array.from({ length: LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          value={value[index] ?? ""}
          data-autofocus={index === 0 ? "" : undefined}
          onChange={(event) => handleInput(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          // No "jump back to the first empty box" guard here: this handler would
          // capture a stale `value` and fight the programmatic focus move made
          // while typing. handleInput already clamps writes to the end of the
          // code, so clicking a later box still fills left to right.
          onFocus={(event) => event.target.select()}
          className={`h-13 w-full min-w-0 rounded-lg border bg-white text-center font-mono text-xl font-semibold text-navy-900 shadow-xs outline-none transition
            focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
            ${
              invalid
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/12"
                : "border-line hover:border-line-strong focus:border-brand-500 focus:ring-brand-500/12"
            }`}
        />
      ))}
    </div>
  );
}
