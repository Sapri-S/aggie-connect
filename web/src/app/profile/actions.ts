"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  echoValues,
  profileSchema,
  type FormState,
} from "@/lib/validation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = echoValues(formData);
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { values, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { values, error: "Your session expired. Sign in again." };

  const p = parsed.data;
  // Only these columns are writable by users (column grants + RLS), so even
  // a tampered request can't touch role or status.
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: p.firstName,
      last_name: p.lastName,
      class_year: p.classYear,
      headline: p.headline,
      job_title: p.jobTitle,
      company: p.company,
      major: p.major,
      city: p.city,
      bio: p.bio,
      linkedin_url: p.linkedinUrl,
    })
    .eq("id", user.id);

  if (error) {
    console.error("updateProfile failed", error.code);
    return { values, error: "Couldn't save your profile. Try again." };
  }

  revalidatePath("/profile/edit");
  return { values, success: "Profile saved." };
}

export async function uploadAvatar(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo first." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { error: "That photo is over 4 MB. Choose a smaller one." };
  }
  if (!AVATAR_TYPES.includes(file.type)) {
    return { error: "Use a JPG, PNG or WebP photo." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // Re-encode instead of trusting the upload: this rejects files that
  // aren't really images, strips EXIF (including GPS location), fixes
  // rotation and keeps every avatar small.
  let image: Buffer;
  try {
    image = await sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize(512, 512, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { error: "That file isn't a photo we can read. Try another." };
  }

  const path = `${user.id}/${randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, image, { contentType: "image/webp" });
  if (uploadError) {
    console.error("avatar upload failed", uploadError.message);
    return { error: "Couldn't upload your photo. Try again." };
  }

  const { data: before } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .single();

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", user.id);
  if (updateError) {
    await supabase.storage.from("avatars").remove([path]);
    return { error: "Couldn't save your photo. Try again." };
  }

  if (before?.avatar_path) {
    await supabase.storage.from("avatars").remove([before.avatar_path]);
  }

  revalidatePath("/profile/edit");
  return { success: "Photo updated." };
}

export async function removeAvatar(): Promise<FormState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { data: before } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", user.id);
  if (error) return { error: "Couldn't remove your photo. Try again." };

  if (before?.avatar_path) {
    await supabase.storage.from("avatars").remove([before.avatar_path]);
  }

  revalidatePath("/profile/edit");
  return { success: "Photo removed." };
}
