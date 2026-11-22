import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatInput } from "./adjutant-contract";

export const askAdjutant = createServerFn({ method: "POST" })
  .inputValidator(input => chatInput.parse(input))
  .handler(async ({ data }) => {
    const { respond } = await import("./adjutant.server");
    return respond(data);
  });

export const askAdjutantSignedIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => chatInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: materials, error } = await context.supabase.from("materials")
      .select("title,description,is_quiz,file_name").order("created_at", { ascending: false }).limit(100);
    const { respond } = await import("./adjutant.server");
    return respond(data, error ? "Material list temporarily unavailable; do not invent materials." : JSON.stringify(materials));
  });