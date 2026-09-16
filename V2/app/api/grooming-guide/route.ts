import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { applyGroomingGuardrail } from "@/lib/grooming-guardrail";

/**
 * Server-side AI grooming generation (ticket 08), the same shape as the diet
 * route (ticket 07): keeps the AI key off the client, generates a structured
 * guide, runs the guardrail, and returns a guide or an error (on which the seam
 * falls back to the templated generator). Provider is Groq (model
 * openai/gpt-oss-120b); the key is read from GROQ_API_KEY.
 */
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const suggestionSchema = z.object({
  summary: z.string(),
  frequencyWeeks: z.number(),
  routine: z.array(z.string()),
  professional: z.string(),
});

export async function POST(request: Request) {
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
  const breed = String(body.breed ?? "").slice(0, 120);
  const ageLabel = String(body.ageLabel ?? "").slice(0, 60);
  const coatType = String(body.coatType ?? "").slice(0, 120);

  try {
    const { object } = await generateObject({
      model: groq("openai/gpt-oss-120b"),
      schema: suggestionSchema,
      system:
        `You are a calm, practical pet-care assistant giving general everyday grooming guidance for a HEALTHY ${species.toUpperCase()}. ` +
        `Every recommendation must be appropriate for a ${species}; never give advice meant for another species (cats self-groom and rarely need baths; dogs need regular ones). ` +
        "Tailor to THIS pet:\n" +
        "- COAT TYPE drives brushing cadence and mat risk (long, double, or curly coats need more frequent brushing than short or smooth ones).\n" +
        "- BREED informs typical coat, shedding, and grooming needs.\n" +
        "- `frequencyWeeks` is the recommended professional-groom cadence in weeks.\n" +
        "Give general at-home grooming guidance only. Do NOT diagnose skin or ear conditions, prescribe, or recommend medicated or prescription products; if something looks wrong, say to see a vet. " +
        "Write plainly and warmly. Do NOT use em dashes anywhere; use commas or short separate sentences.",
      prompt:
        "Pet details:\n" +
        `- Species: ${species}\n` +
        `- Breed: ${breed || "unknown"}\n` +
        `- Age: ${ageLabel || "unknown"}\n` +
        `- Coat type: ${coatType || "unknown"}\n\n` +
        "Give a short grooming guide tailored to this pet's breed and coat: a one-sentence summary, " +
        "frequencyWeeks (recommended professional-groom cadence), 3 to 4 at-home routine steps, and one line about professional grooming.",
    });

    const guarded = applyGroomingGuardrail(object);
    if (!guarded.ok) {
      return NextResponse.json({ error: "guardrail_rejected", reason: guarded.reason }, { status: 422 });
    }

    return NextResponse.json({
      guide: {
        summary: guarded.summary,
        frequencyWeeks: guarded.frequencyWeeks,
        routine: guarded.routine,
        professional: guarded.professional,
      },
    });
  } catch {
    return NextResponse.json({ error: "ai_error" }, { status: 502 });
  }
}
