import { describe, expect, it } from "vitest";
import { SupabasePassportRepository } from "./supabase-passport-repository";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A fake Supabase client whose .rpc() resolves to whatever `data` is
 * given, mimicking the exact shape PostgREST returns for a SQL-language
 * function with a single-composite (non-SETOF) return type.
 */
function fakeClientWithRpcResult(data: unknown): SupabaseClient {
  return {
    rpc: async () => ({ data, error: null }),
  } as unknown as SupabaseClient;
}

describe("SupabasePassportRepository.findByShareToken", () => {
  it("returns null when the RPC finds no matching row, represented as an all-null composite object rather than JSON null", async () => {
    // This is exactly what Postgres/PostgREST return for a SQL-language
    // function with a single-composite return type when the underlying
    // query matches zero rows — a truthy object, not `null` itself.
    const client = fakeClientWithRpcResult({
      id: null,
      owner_id: null,
      name: null,
      species: null,
      breed: null,
      birth_date: null,
      weight_kg: null,
      photo_url: null,
      created_at: null,
      quirks: null,
      vet_name: null,
      vet_phone: null,
      vet_clinic: null,
      share_token: null,
    });
    const repo = new SupabasePassportRepository(client);

    const result = await repo.findByShareToken("does-not-exist");

    expect(result).toBeNull();
  });

  it("maps a real matching row to a Passport", async () => {
    const client = fakeClientWithRpcResult({
      id: "passport-1",
      owner_id: "owner-1",
      name: "Biscuit",
      species: "dog",
      breed: "Labrador",
      birth_date: "2022-01-15",
      weight_kg: 24.5,
      photo_url: "https://example.com/biscuit.jpg",
      created_at: "2026-01-01T00:00:00.000Z",
      quirks: null,
      vet_name: null,
      vet_phone: null,
      vet_clinic: null,
      share_token: "the-token",
    });
    const repo = new SupabasePassportRepository(client);

    const result = await repo.findByShareToken("the-token");

    expect(result?.id).toBe("passport-1");
    expect(result?.name).toBe("Biscuit");
  });
});
