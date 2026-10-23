import type { ComponentProps, ReactNode } from "react";

export function Field({
  label,
  name,
  errors,
  hint,
  ...input
}: {
  label: string;
  name: string;
  errors?: string[];
  hint?: ReactNode;
} & ComponentProps<"input">) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={errors ? true : undefined}
        aria-describedby={errors ? `${id}-error` : undefined}
        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        {...input}
      />
      {hint && !errors && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {errors && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  name,
  errors,
  hint,
  ...textarea
}: {
  label: string;
  name: string;
  errors?: string[];
  hint?: ReactNode;
} & ComponentProps<"textarea">) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        aria-invalid={errors ? true : undefined}
        aria-describedby={errors ? `${id}-error` : undefined}
        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        {...textarea}
      />
      {hint && !errors && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {errors && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
    >
      {pending ? "One moment…" : children}
    </button>
  );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-md bg-primary-tint px-3 py-2 text-sm text-danger">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="rounded-md bg-primary-tint px-3 py-2 text-sm text-success">
        {success}
      </p>
    );
  }
  return null;
}

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 sm:py-12">
      <div className="rounded-xl border border-line bg-surface p-5 sm:p-8">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
