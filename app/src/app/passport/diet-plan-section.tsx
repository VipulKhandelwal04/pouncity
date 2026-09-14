"use client";

import { useState } from "react";
import { isNextRedirectError } from "@/lib/next-redirect";
import { generateDietPlanAction } from "./diet-plan-actions";
import type { DietPlan } from "@/lib/diet/diet-plan";

export function DietPlanSection({ plan }: { plan: DietPlan | null }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setGenerating(true);
    setError(null);
    try {
      await generateDietPlanAction(formData);
    } catch (err) {
      if (isNextRedirectError(err)) {
        throw err;
      }
      setError("Could not generate a plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section aria-labelledby="diet-plan-heading">
      <h2 id="diet-plan-heading">Diet plan</h2>

      {plan && (
        <div>
          <p>
            <strong>~{plan.dailyCalories} kcal/day</strong>
          </p>
          <p>{plan.feedingGuidance}</p>
          <p role="note">{plan.disclaimer}</p>
        </div>
      )}

      <form action={handleSubmit}>
        <label htmlFor="currentFood">
          {plan ? "Update current food and regenerate" : "What are you currently feeding?"}
        </label>
        <input
          id="currentFood"
          name="currentFood"
          type="text"
          defaultValue={plan?.currentFood ?? ""}
          required
        />

        <button type="submit" disabled={generating}>
          {generating ? "Generating…" : plan ? "Regenerate plan" : "Generate plan"}
        </button>

        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
