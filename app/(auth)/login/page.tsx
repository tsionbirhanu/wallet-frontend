"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, fieldErrors as apiFieldErrors, friendlyMessage } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { useSessionToken } from "@/lib/use-session";
import { AlertIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/icons";

type FieldErrors = Partial<Record<"phone_number" | "password", string>>;

/** Only allow same-origin absolute paths from ?next=, never an external URL. */
function safeRedirect(target: string | null): string {
  if (!target) return "/dashboard";
  if (!target.startsWith("/") || target.startsWith("//")) return "/dashboard";
  return target;
}

export default function LoginPage() {
  const router = useRouter();

  // Session lives in localStorage, so it only resolves on the client. An admin
  // who already has a token never sees the form — they go straight through.
  const token = useSessionToken();
  const signedIn = token !== null;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    router.replace(safeRedirect(new URLSearchParams(window.location.search).get("next")));
  }, [signedIn, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmedPhoneNumber = phoneNumber.trim();
    const errors: FieldErrors = {};
    if (!trimmedPhoneNumber) errors.phone_number = "Enter your admin phone number.";
    if (!password) errors.password = "Enter your password.";

    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await adminLogin({
        phone_number: trimmedPhoneNumber,
        password,
      });
      setPassword("");
      // Triggers the redirect effect above once the session store updates.
      setSession(result.token, result.admin);
    } catch (err) {
      setFormError(friendlyMessage(err));
      const fields = apiFieldErrors(err);
      setFieldErrors({
        phone_number: fields.phone_number,
        password: fields.password,
      });
      setSubmitting(false);
    }
  }

  if (signedIn) {
    return (
      <div className="flex justify-center py-10" role="status" aria-label="Loading">
        <SpinnerIcon className="h-6 w-6 text-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your administrator credentials to open the console.
        </p>
      </header>

      {formError && (
        <div
          role="alert"
          className="mt-6 flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] leading-relaxed text-rose-800"
        >
          <AlertIcon className="mt-px h-4 w-4 shrink-0 text-rose-500" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
        <div>
          <label htmlFor="phone_number" className="field-label">
            Phone number
          </label>
          <input
            autoFocus
            id="phone_number"
            name="phone_number"
            type="tel"
            inputMode="tel"
            autoComplete="username"
            placeholder="+251 911 000 000"
            className={`field-input ${
              fieldErrors.phone_number ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/12" : ""
            }`}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.phone_number)}
            aria-describedby={fieldErrors.phone_number ? "phone-number-error" : undefined}
          />
          {fieldErrors.phone_number && (
            <p id="phone-number-error" className="mt-1.5 text-xs text-rose-600">
              {fieldErrors.phone_number}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`field-input pr-11 ${
                fieldErrors.password
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/12"
                  : ""
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={submitting}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 transition hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOffIcon className="h-[18px] w-[18px]" />
              ) : (
                <EyeIcon className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="mt-1.5 text-xs text-rose-600">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary !mt-7 w-full" disabled={submitting}>
          {submitting ? (
            <>
              <SpinnerIcon className="h-4 w-4" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

    </div>
  );
}
