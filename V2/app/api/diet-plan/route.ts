import { NextResponse } from "next/server";
import { createGoogle } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { applyDietGuardrail } from "@/lib/diet-guardrail";

/**
 * Server-side AI diet generation (ticket 07). Keeps the Gemini key off the
 * client. Generates a structured suggestion, runs it through the safety
 * guardrail, and returns a plan — or an error, on which the client seam falls
 * back to the templated generator so the screen never hard-depends on the model.
 * Provider is Gemini via Google AI Studio (the app's chosen provider); the key
 * is read from GEMINI_API_KEY.
 */
const google = createGoogle({ apiKey: process.env.GEMINI_API_KEY });

const suggestionSchema = z.object({
  summary: z.string(),
  portionGramsPerDay: z.number(),
  meals: z.string(),
  tips: z.array(z.string()),
});

export async function POST(request: Request) {
  // Require a signed-in caller so the AI key can't be burned anonymously.
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const species = body.species === "cat" ? "cat" : "dog";
  const weightKg = typeof body.weightKg === "number" ? body.weightKg : null;
  const breed = String(body.breed ?? "").slice(0, 120);
  const ageLabel = String(body.ageLabel ?? "").slice(0, 60);
  const currentFood = String(body.currentFood ?? "").slice(0, 200);

  try {
    const { object } = await generateObject({
      model: google("gemini-flash-latest"),
      schema: suggestionSchema,
      system:
        "You are a calm, practical pet-care assistant giving general everyday feeding guidance for a HEALTHY pet. " +
        "Give maintenance guidance only. NEVER suggest a prescription, therapeutic, or veterinary condition-specific " +
        "diet, and never diagnose a condition. `portionGramsPerDay` is approximate daily dry-food grams.",
      prompt:
        `Pet: ${species}, breed ${breed || "unknown"}, age ${ageLabel || "unknown"}, ` +
        `weight ${weightKg ?? "unknown"} kg, currently eating ${currentFood || `a complete ${species} food`}. ` +
        "Give a short feeding plan: a one-sentence summary, approximate daily grams, meals per day, and 3-4 practical tips.",
    });

    const guarded = applyDietGuardrail(object, { species, weightKg });
    if (!guarded.ok) {
      // Reject → the client falls back to the templated plan.
      return NextResponse.json({ error: "guardrail_rejected", reason: guarded.reason }, { status: 422 });
    }

    return NextResponse.json({
      plan: {
        summary: guarded.summary,
        portionPerDay: guarded.portionPerDay,
        meals: guarded.meals,
        tips: guarded.tips,
      },
    });
  } catch {
    return NextResponse.json({ error: "ai_error" }, { status: 502 });
  }
}
