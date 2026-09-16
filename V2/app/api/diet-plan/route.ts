import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { applyDietGuardrail } from "@/lib/diet-guardrail";

/**
 * Server-side AI diet generation (ticket 07). Keeps the AI key off the
 * client. Generates a structured suggestion, runs it through the safety
 * guardrail, and returns a plan — or an error, on which the client seam falls
 * back to the templated generator so the screen never hard-depends on the model.
 * Provider is Groq (model openai/gpt-oss-120b); the key is read from
 * GROQ_API_KEY.
 */
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

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

  if (!process.env.GROQ_API_KEY) {
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
      model: groq("openai/gpt-oss-120b"),
      schema: suggestionSchema,
      system:
        "You are a calm, practical pet-care assistant giving general everyday feeding guidance for a HEALTHY pet. " +
        "Tailor the plan to THIS pet:\n" +
        "- WEIGHT drives the daily portion (approximate maintenance energy for that body size).\n" +
        "- AGE sets life stage and meal frequency: puppies and kittens need more frequent, smaller meals and more energy per kg; adults are steady; seniors usually need slightly less.\n" +
        "- BREED informs size class, typical energy level, and body-condition tendencies (some breeds gain weight easily).\n" +
        "Give MAINTENANCE guidance only. NEVER suggest a prescription, therapeutic, or veterinary condition-specific diet, and never diagnose a condition. " +
        "Write plainly and warmly. Do NOT use em dashes anywhere; use commas or short separate sentences. " +
        "`portionGramsPerDay` is the approximate daily dry-food grams for this pet.",
      prompt:
        "Pet details:\n" +
        `- Species: ${species}\n` +
        `- Breed: ${breed || "unknown"}\n` +
        `- Age: ${ageLabel || "unknown"}\n` +
        `- Weight: ${weightKg ?? "unknown"} kg\n` +
        `- Currently eating: ${currentFood || `a complete ${species} food`}\n\n` +
        "Give a short feeding plan tailored to this pet's breed, age, and weight: a one-sentence summary, " +
        "the approximate daily grams (portionGramsPerDay), meals per day suited to the life stage, and 3 to 4 practical, specific tips.",
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
