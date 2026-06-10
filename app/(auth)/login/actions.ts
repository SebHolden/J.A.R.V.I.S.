"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  let authError: { message: string } | null = null;
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    authError = error;
  } catch {
    return {
      error:
        "Impossibile contattare Supabase. Avvia Docker Desktop, poi esegui: npx supabase start && npx supabase db reset",
    };
  }

  if (authError) {
    return { error: authError.message };
  }

  redirect("/");
}
