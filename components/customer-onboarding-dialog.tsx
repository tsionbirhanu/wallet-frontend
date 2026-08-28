"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { fieldErrors, friendlyMessage, isApiError, registerCustomer, verifyRegistrationOtp } from "@/lib/api";
import { formatCountdown } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { AlertIcon, CheckCircleIcon, ClockIcon, SpinnerIcon } from "@/components/icons";
import { Modal } from "@/components/modal";
import { OtpInput } from "@/components/otp-input";

type Step = "form" | "otp" | "done";

interface Props {
  /** Pass a pending customer to skip registration and go straight to the code. */
  customer?: Customer | null;
  onClose: () => void;
  /** Fires on registration (pending) and again on activation (active). */
  onCustomerChanged: (customer: Customer, event: "registered" | "activated") => void;
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  autoFocus,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  inputMode?: "text" | "tel" | "numeric";
  autoComplete?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        data-autofocus={autoFocus ? "" : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`field-input ${
          error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/12" : ""
        }`}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="mb-5 flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] leading-relaxed text-rose-800"
    >
      <AlertIcon className="mt-px h-4 w-4 shrink-0 text-rose-500" />
      <span>{children}</span>
    </div>
  );
}

/**
 * Registration is a two-step conversation: create the customer, then read the
 * SMS code back from them over the phone. Mounted only while open, so each run
 * starts from clean state.
 */
export function CustomerOnboardingDialog({ customer, onClose, onCustomerChanged }: Props) {
  const verifyOnly = Boolean(customer);

  const [step, setStep] = useState<Step>(verifyOnly ? "otp" : "form");
  const [target, setTarget] = useState<Customer | null>(customer ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [pin, setPin] = useState("");
  const [pinWasSet, setPinWasSet] = useState(false);
  const [code, setCode] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // One ticking clock drives the expiry countdown; seconds are derived, so the
  // first render after the code is issued is already correct.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const secondsLeft = expiresAt
    ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000))
    : null;
  const expired = secondsLeft === 0;

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const submittedPin = pin.trim();
    const body = {
      full_name: fullName.trim(),
      phone_number: phone.trim(),
      national_id: nationalId.trim(),
      ...(submittedPin ? { pin: submittedPin } : {}),
    };

    const clientErrors: Record<string, string> = {};
    if (!body.full_name) clientErrors.full_name = "Enter the customer's full name.";
    if (!body.phone_number) clientErrors.phone_number = "Enter a phone number.";
    if (!body.national_id) clientErrors.national_id = "Enter a national ID.";
    if (submittedPin && !/^\d{4,6}$/.test(submittedPin)) {
      clientErrors.pin = "PIN must be 4 to 6 digits.";
    }

    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    setPin("");
    try {
      const result = await registerCustomer(body);
      setPinWasSet(Boolean(submittedPin));
      onCustomerChanged(result.customer, "registered");
      setTarget(result.customer);
      setExpiresAt(result.otp.expires_at);
      setNow(Date.now());
      setStep("otp");
    } catch (err) {
      setFormError(friendlyMessage(err));
      const fields = fieldErrors(err);
      if (isApiError(err) && err.code === "PHONE_NUMBER_ALREADY_EXISTS") {
        fields.phone_number = "Already registered to another customer.";
      }
      if (isApiError(err) && err.code === "NATIONAL_ID_ALREADY_EXISTS") {
        fields.national_id = "Already registered to another customer.";
      }
      setErrors(fields);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(submitted = code) {
    if (submitting || !target || submitted.length !== 6) return;

    setFormError(null);
    setSubmitting(true);
    try {
      const result = await verifyRegistrationOtp(target.id, submitted);
      onCustomerChanged(result.customer, "activated");
      setTarget(result.customer);
      setStep("done");
    } catch (err) {
      setFormError(friendlyMessage(err));
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done" && target) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Customer activated"
        footer={
          <button type="button" className="btn-primary" onClick={onClose} data-autofocus>
            Done
          </button>
        }
      >
        <div className="py-2">
          <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircleIcon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-800">
            {target.full_name} is now active.
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
            Their wallet is open and ready to receive deposits.
          </p>
          </div>
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left">
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-emerald-700">Customer</dt>
                <dd className="font-medium text-emerald-950">{target.full_name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-emerald-700">Phone</dt>
                <dd className="font-mono font-medium text-emerald-950">{target.phone_number}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-emerald-200 pt-3 text-[13px] leading-relaxed text-emerald-800">
              {pinWasSet
                ? "PIN has been set - share it with the customer securely."
                : "No PIN was set during registration. Use Reset PIN before the customer logs into the mobile app."}
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  if (step === "otp" && target) {
    return (
      <Modal
        open
        onClose={onClose}
        dismissible={!submitting}
        title="Enter the verification code"
        description={
          <>
            A 6-digit code was sent by SMS to{" "}
            <span className="font-mono text-slate-700">{target.phone_number}</span>. Ask{" "}
            {target.full_name.split(/\s+/)[0]} to read it back to you.
          </>
        }
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Verify later
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleVerify()}
              disabled={submitting || code.length !== 6}
            >
              {submitting ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Verifying…
                </>
              ) : (
                "Verify and activate"
              )}
            </button>
          </>
        }
      >
        {formError && <ErrorBanner>{formError}</ErrorBanner>}

        <OtpInput
          label="6-digit verification code"
          value={code}
          onChange={setCode}
          onComplete={(complete) => handleVerify(complete)}
          disabled={submitting}
          invalid={Boolean(formError)}
          describedBy="otp-expiry"
        />

        <p
          id="otp-expiry"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500"
        >
          <ClockIcon className="h-3.5 w-3.5" />
          {secondsLeft === null ? (
            "Codes expire 5 minutes after they are issued."
          ) : expired ? (
            <span className="text-rose-600">
              This code has expired — the customer stays pending.
            </span>
          ) : (
            <>
              Expires in{" "}
              <span className="font-mono font-medium text-slate-700">
                {formatCountdown(secondsLeft)}
              </span>
            </>
          )}
        </p>

        <p className="mt-4 rounded-lg bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-500">
          Closing this leaves {target.full_name} pending. You can pick the verification back
          up from their profile — but note the API has no resend endpoint yet, so an expired
          code cannot be replaced.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!submitting}
      title="Register customer"
      description="Creates the customer and their wallet, then sends a verification code by SMS."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="register-customer" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <SpinnerIcon className="h-4 w-4" />
                Registering…
              </>
            ) : (
              "Register and send code"
            )}
          </button>
        </>
      }
    >
      {formError && <ErrorBanner>{formError}</ErrorBanner>}

      <form id="register-customer" onSubmit={handleRegister} noValidate className="space-y-4">
        <TextField
          id="full_name"
          label="Full name"
          value={fullName}
          onChange={setFullName}
          error={errors.full_name}
          disabled={submitting}
          placeholder="Aster Bekele"
          autoComplete="off"
          autoFocus
        />
        <TextField
          id="phone_number"
          label="Phone number"
          value={phone}
          onChange={setPhone}
          error={errors.phone_number}
          disabled={submitting}
          placeholder="+251 911 000 000"
          inputMode="tel"
          autoComplete="off"
        />
        <TextField
          id="national_id"
          label="National ID"
          value={nationalId}
          onChange={setNationalId}
          error={errors.national_id}
          disabled={submitting}
          placeholder="ETH-1234567"
          autoComplete="off"
        />
        <TextField
          id="pin"
          label="Set Customer PIN"
          value={pin}
          onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))}
          error={errors.pin}
          disabled={submitting}
          placeholder="4-6 digits"
          inputMode="numeric"
          autoComplete="new-password"
          type="password"
          maxLength={6}
        />
        <p className="-mt-2 text-xs leading-relaxed text-slate-500">
          Customer will need this PIN to log into the mobile app.
        </p>
      </form>
    </Modal>
  );
}
