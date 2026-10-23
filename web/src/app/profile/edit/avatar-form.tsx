"use client";

import { useActionState, useRef, useState } from "react";
import { removeAvatar, uploadAvatar } from "../actions";
import { Avatar } from "@/components/avatar";
import { FormMessage } from "@/components/form-fields";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, type FormState } from "@/lib/validation";

export function AvatarForm({
  url,
  firstName,
  lastName,
}: {
  url: string | null;
  firstName: string;
  lastName: string;
}) {
  const [state, upload, uploading] = useActionState<FormState, FormData>(uploadAvatar, {});
  const [removeState, remove, removing] = useActionState<FormState>(removeAvatar, {});
  const [clientError, setClientError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const pending = uploading || removing;

  // Check size and type before sending, so a 20 MB photo fails instantly
  // instead of after a long upload. The server checks again.
  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setClientError(undefined);
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setClientError("Use a JPG, PNG or WebP photo.");
      event.target.value = "";
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setClientError("That photo is over 4 MB. Choose a smaller one.");
      event.target.value = "";
      return;
    }
    formRef.current?.requestSubmit();
  }

  const message = clientError ?? state.error ?? removeState.error;
  const success = !message ? (state.success ?? removeState.success) : undefined;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
      <Avatar url={url} firstName={firstName} lastName={lastName} size="lg" className="border-4 border-surface shadow" />
      <div className="space-y-2 text-center sm:text-left">
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <form ref={formRef} action={upload}>
            <label
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-md bg-primary px-4 text-sm sm:min-h-0 sm:py-2 font-semibold text-on-primary hover:bg-primary-hover ${pending ? "pointer-events-none opacity-60" : ""}`}
            >
              {uploading ? "Uploading…" : url ? "Change photo" : "Add a photo"}
              <input
                type="file"
                name="avatar"
                accept={AVATAR_TYPES.join(",")}
                className="sr-only"
                onChange={onPick}
                disabled={pending}
              />
            </label>
          </form>
          {url && (
            <form action={remove}>
              <button
                disabled={pending}
                className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm font-semibold text-muted sm:min-h-0 sm:py-2 hover:text-ink disabled:opacity-60"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            </form>
          )}
        </div>
        <p className="text-xs text-muted">JPG, PNG or WebP, up to 4 MB. Only approved members can see it.</p>
        <FormMessage error={message} success={success} />
      </div>
    </div>
  );
}
