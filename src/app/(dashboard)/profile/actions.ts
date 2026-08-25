"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { DEMO_READ_ONLY_MESSAGE, isDemoUser } from "@/lib/demo";
import { captureServerException } from "@/lib/observability/server-monitoring";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const profileNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be less than 80 characters."),
});

export async function updateProfileNameAction(formData: FormData) {
  if (!(formData instanceof FormData)) {
    return {
      ok: false as const,
      error: "Invalid profile update. Please refresh and try again.",
    };
  }

  const parsed = profileNameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Enter a valid name.",
    };
  }

  const nextName = parsed.data.name;

  try {
    const currentUser = await getCurrentUserOrThrow();
    if (isDemoUser(currentUser)) {
      return { ok: false as const, error: DEMO_READ_ONLY_MESSAGE };
    }
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        name: nextName,
        full_name: nextName,
      },
    });

    if (error) {
      return {
        ok: false as const,
        error: "We couldn't update your profile name right now.",
      };
    }

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: nextName,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      message: "Your display name is updated.",
    };
  } catch (error) {
    captureServerException(error, {
      area: "profile",
      action: "update-profile-name",
      message: "[profile] failed to update display name",
    });

    return {
      ok: false as const,
      error: "We couldn't update your profile name right now.",
    };
  }
}
