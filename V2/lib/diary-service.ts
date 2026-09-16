/**
 * diary-service — the ONE data seam for the whole owner app.
 *
 * Every screen talks to this module and nothing else touches storage, the
 * network, or an LLM. Today it is backed by localStorage with seeded data and
 * canned generation. When the backend lands, only the *insides* of these
 * functions change (Supabase queries + AI Gateway calls) — the exported shapes
 * and the screens stay put. That is what makes "integrate the backend later" a
 * swap behind this boundary instead of a UI rewrite.
 *
 * Contract owned here (per docs/spec-owner-app-ui-tickets-02-08.md):
 *   - diary read/write (core + optional fields)      [tickets 01-03]
 *   - diet / grooming generation requests            [tickets 04, 06]
 *   - the feeding confirm (idempotent daily)         [ticket 05]
 *   - handover-link lifecycle + caregiver binding    [tickets 07-09]
 *
 * Ticket 01 (async seam prefactor): every function that touches storage is
 * async / Promise-returning, so the later backend tickets swap a function
 * body (localStorage -> Supabase query) with zero call-site churn. Pure
 * derived-view helpers that operate on an already-loaded Diary/value with no
 * I/O (isFedToday, dietStatus, completeness, handoverReadiness, the templated
 * generateDietPlan/generateGroomingGuide, handoverCode, ...) deliberately stay
 * synchronous — they never touch storage even after the backend lands, and
 * forcing them async would only make every inline JSX use of them (e.g.
 * `{dietStatus(diary).label}`) clumsier for no real benefit. This is a
 * judgment call on an otherwise-blanket "every exported function returns a
 * Promise" instruction in the ticket text; noting it here rather than
 * silently picking a side.
 *
 * Ticket 02 (real auth + core persistence): Account, Diary (core + optional
 * fields), and ownership (Membership role='owner') are now backed by
 * Supabase — Postgres + Auth + the pet-photos/rabies-certificates Storage
 * buckets. Sign-in is real (email magic link, Google), scoped by
 * `V2/supabase/migrations/0002_account_diary_membership.sql`. Everything
 * downstream of a Diary that its OWN ticket hasn't landed yet — diet plan,
 * grooming guide — still lives in the same localStorage mock as before
 * (tickets 07-08). Feeding log, handover link, Caregiver membership (PR A),
 * Past Caregiver + Rating (ticket 05 / PR B) are now on Supabase.
 * `getDiaryById`/`getDiary` merge the two: Supabase
 * is the source of truth for a real diary's core fields; a localStorage
 * "shadow" entry under the same diary id supplies whatever those later
 * tickets haven't moved yet. This keeps every existing flow working
 * unchanged in the same session while the core identity genuinely persists
 * cross-device, which is what this ticket's acceptance criteria ask for.
 */

import { supabaseBrowser } from "./supabase/client";

export type Species = "dog" | "cat";

/** Desexing status — neutered (male), spayed (female), or none/intact. */
export type NeuterStatus = "neutered" | "spayed" | "none";

export interface VetContact {
  name: string;
  phone: string;
  clinic: string;
}

/**
 * Rabies vaccination record. Its mere presence (`rabies != null`) is the
 * "vaccinated?" flag; the fields inside are the proof owners attach when they
 * have it. In this UI phase the certificate is a downscaled image data URL
 * (Supabase Storage replaces it later, same field name).
 */
export interface RabiesRecord {
  /** A photo of the certificate (image data URL), or null if not uploaded yet. */
  certificateUrl: string | null;
  /** ISO date (yyyy-mm-dd) the certificate expires, or null if not entered. */
  expiry: string | null;
}

/** How a diet plan was produced (ticket 07). */
export type DietSource = "ai" | "templated" | "manual";

export interface DietPlan {
  createdAt: string;
  currentFood: string;
  summary: string;
  portionPerDay: string;
  meals: string;
  tips: string[];
  source: DietSource;
}

export interface GroomingGuide {
  createdAt: string;
  coatType: string;
  frequencyWeeks: number;
  summary: string;
  routine: string[];
  professional: string;
}

export interface FeedingEntry {
  /** ISO date (yyyy-mm-dd) — one per diary per day (idempotent). */
  date: string;
  by: string;
  note?: string;
}

export interface HandoverState {
  token: string | null;
  createdAt: string | null;
}

export interface Diary {
  id: string;
  name: string;
  species: Species;
  breed: string;
  ageLabel: string;
  weightKg: number | null;
  photoUrl: string | null;
  quirks: string | null;
  vet: VetContact | null;
  /** Desexing status: neutered / spayed / none. */
  neuterStatus: NeuterStatus;
  /** Whether the pet is registered (council / microchip registry). */
  registered: boolean;
  /** Rabies vaccination proof; null = not vaccinated / not recorded. */
  rabies: RabiesRecord | null;
  currentFood: string | null;
  coatType: string | null;
  dietPlan: DietPlan | null;
  groomingGuide: GroomingGuide | null;
  feedingLog: FeedingEntry[];
  handover: HandoverState;
  createdAt: string;
  /**
   * A seeded example the current person "helps with" — only exists because the
   * mock is single-browser and can't produce real cross-account caregiving.
   * Shown with a visible "Demo" marker; retires once the backend makes caregiving
   * data real. Absent/false on every real diary.
   */
  demo?: boolean;
}

export type Role = "owner" | "caregiver";

/** A person using the app — the identity behind Sign-in. `name` is "" until captured. */
export interface Account {
  id: string;
  name: string;
  email: string;
}

/** Binds an Account to a Diary with a role. Roles are per-diary, never global. */
export interface Membership {
  accountId: string;
  diaryId: string;
  role: Role;
}

/**
 * A former Caregiver retained privately for the Owner (ADR-0006). Access ended
 * when the Owner revoked the link; this is history, NOT a live Membership, so it
 * grants no access to the Diary. Kept so the Owner can remember who helped and
 * (ticket 07) keep a private Rating on them.
 */
export interface PastCaregiver {
  accountId: string;
  diaryId: string;
  /** ISO timestamp when the Owner revoked the link that bound them. */
  endedAt: string;
}

/**
 * Private feedback an Owner keeps on a Caregiver (CONTEXT.md: Rating). Stars
 * (1-5) plus an optional note, tied to (Owner, Caregiver, Diary). Visible ONLY
 * to the Owner who wrote it — never to the Caregiver, never aggregated (ADR-0005)
 * — and used to order/flag the Circle. One per (owner, caregiver, diary); it
 * survives a revoke and re-share, so a past helper keeps their Rating.
 */
export interface Rating {
  ownerAccountId: string;
  caregiverAccountId: string;
  diaryId: string;
  stars: number;
  note?: string;
  updatedAt: string;
}

// Legacy single-diary keys — read once for migration, then removed.
const DIARY_KEY = "pouncity_diary_v1";
const SESSION_KEY = "pouncity_session_v1";
// Current model: an accounts registry + a current-account pointer, diaries by id, memberships.
const ACCOUNTS_KEY = "pouncity_accounts_v1";
const CURRENT_ACCOUNT_KEY = "pouncity_current_account_v1";
const DIARIES_KEY = "pouncity_diaries_v1";
const MEMBERSHIPS_KEY = "pouncity_memberships_v1";
const NUDGE_KEY = "pouncity_nudge_dismissed_v1";
// An anonymous per-browser fingerprint (ticket 04) so the public handover
// route can dedupe repeat opens from the same visitor, before they have an
// account. Never tied to identity beyond "the same browser opened this link
// more than once".
const RECIPIENT_KEY = "pouncity_recipient_key_v1";
const FEED_REMINDERS_KEY = "pouncity_feed_reminders_v1"; // { [diaryId]: boolean }
const GROOM_REMINDER_KEY = "pouncity_groom_reminder_v1";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function read<T>(key: string): T | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — the app still runs for the session */
  }
}

/* ---- accounts + diaries store (the model behind every read/write) ------- */

/**
 * One-time migration from the legacy single-diary shape (`pouncity_diary_v1` +
 * `pouncity_session_v1`) to the account model. Guarded by the presence of
 * DIARIES_KEY, so it runs at most once and is a no-op forever after. It is
 * self-contained (writes storage directly, never calls signIn/createDiary) to
 * avoid re-entrancy, and every public entry point calls it before touching the
 * store so there is no code path that reads the old shape by accident.
 */
function ensureMigrated(): void {
  if (!hasWindow()) return;
  if (read<Record<string, Diary>>(DIARIES_KEY) !== null) return; // already on the new shape

  const legacyDiary = read<Diary>(DIARY_KEY);
  const legacySession = read<{ email: string }>(SESSION_KEY);

  const diaries: Record<string, Diary> = {};
  const accounts: Record<string, Account> = {};
  const memberships: Membership[] = [];

  if (legacyDiary || legacySession) {
    const email = (legacySession?.email ?? "you@pouncity.app").trim();
    const account: Account = { id: "a_" + Math.random().toString(36).slice(2, 9), name: "", email };
    accounts[account.id] = account;
    if (legacyDiary) {
      diaries[legacyDiary.id] = legacyDiary;
      memberships.push({ accountId: account.id, diaryId: legacyDiary.id, role: "owner" });
    }
    write(ACCOUNTS_KEY, accounts);
    write(CURRENT_ACCOUNT_KEY, account.id);
  }

  // Always stamp the marker (even for a brand-new user) so migration never re-runs.
  write(DIARIES_KEY, diaries);
  write(MEMBERSHIPS_KEY, memberships);

  // Only retire the legacy keys once the new shape is confirmed persisted. If the
  // write silently failed (quota — a 2MB cert makes this real), leaving the legacy
  // keys in place lets the next entry point retry migration instead of losing data.
  const persisted = read<Record<string, Diary>>(DIARIES_KEY);
  const diaryCarried = !legacyDiary || (persisted !== null && persisted[legacyDiary.id] != null);
  if (persisted !== null && diaryCarried) {
    try {
      window.localStorage.removeItem(DIARY_KEY);
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
}

function readAccounts(): Record<string, Account> {
  return read<Record<string, Account>>(ACCOUNTS_KEY) ?? {};
}

function readDiaries(): Record<string, Diary> {
  return read<Record<string, Diary>>(DIARIES_KEY) ?? {};
}

function readMemberships(): Membership[] {
  return read<Membership[]>(MEMBERSHIPS_KEY) ?? [];
}

/** The single write path for a diary — keyed by id, so any diary can be persisted. */
function writeDiary(diary: Diary): void {
  const all = readDiaries();
  all[diary.id] = diary;
  write(DIARIES_KEY, all);
}

/* ---- accounts (Supabase Auth, ticket 02) --------------------------------- */

/**
 * Mirror a real Supabase account into the legacy local accounts registry, so
 * the caregiver/handover/rating functions below — not yet migrated off
 * localStorage (tickets 03-06) — can keep resolving an account id to a
 * name/email exactly as before. Safe to delete once ticket 06 moves Caregiver
 * membership onto Supabase too.
 */
function mirrorAccount(account: Account): void {
  const accounts = readAccounts();
  accounts[account.id] = account;
  write(ACCOUNTS_KEY, accounts);
}

/** The signed-in account, or null when signed out. `name` is "" until captured. */
export async function getAccount(): Promise<Account | null> {
  ensureMigrated();
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("account")
    .select("id,name,email")
    .eq("id", user.id)
    .maybeSingle();
  // The account row is created by a DB trigger on signup; if it hasn't landed
  // yet (a rare race right after first sign-in), fall back to the session.
  const account: Account = data ?? { id: user.id, name: "", email: user.email ?? "" };
  mirrorAccount(account);
  return account;
}

/**
 * Send a passwordless sign-in email to this address. The same one-time request
 * backs two ways in: the clickable link (lands on /auth/callback) and a 6-digit
 * code the visitor can type instead — see `verifyEmailCode`. Which of the two
 * the email shows is controlled by the Supabase "Magic Link" template
 * (`{{ .ConfirmationURL }}` for the link, `{{ .Token }}` for the code); include
 * both to offer both. `emailRedirectTo` is kept so the link path still works.
 */
export async function requestMagicLink(email: string, next = "/diary"): Promise<void> {
  const supabase = supabaseBrowser();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

/**
 * Verify the 6-digit code from the sign-in email and establish the session in
 * this browser. This is the cross-device path (start on a laptop, read the code
 * on a phone) and the fallback when a link is mangled by an in-app browser —
 * unlike the PKCE link, the code is not bound to the device that requested it.
 * On success `createBrowserClient` writes the session cookie, so middleware and
 * server components see the signed-in user on the next navigation. Throws on a
 * wrong or expired code so the screen can prompt a retry / resend.
 */
export async function verifyEmailCode(email: string, token: string): Promise<void> {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: "email",
  });
  if (error) throw error;
}

/** Start a Google OAuth sign-in; lands on /auth/callback. */
export async function signInWithGoogle(next = "/diary"): Promise<void> {
  const supabase = supabaseBrowser();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

/** Capture / change the current account's display name (used for attribution). */
export async function setAccountName(name: string): Promise<Account | null> {
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const clean = name.trim();
  const { data } = await supabase
    .from("account")
    .update({ name: clean })
    .eq("id", user.id)
    .select("id,name,email")
    .maybeSingle();
  if (!data) return null;
  mirrorAccount(data as Account);
  return data as Account;
}

/** Sign out of the real Supabase session. */
export async function signOut(): Promise<void> {
  const supabase = supabaseBrowser();
  await supabase.auth.signOut();
}

/* ---- memberships (per-diary roles) -------------------------------------- */

/** Memberships for the signed-in account (owner and/or caregiver, per diary). */
export async function getMemberships(): Promise<Membership[]> {
  const acct = await getAccount();
  if (!acct) return [];
  const supabase = supabaseBrowser();
  const { data } = await supabase
    .from("membership")
    .select("account_id,diary_id,role")
    .eq("account_id", acct.id);
  const owned: Membership[] = (data ?? []).map((m) => ({
    accountId: m.account_id,
    diaryId: m.diary_id,
    role: m.role as Role,
  }));
  // Real caregiver memberships now come from Supabase (above); the localStorage
  // mock only still holds DEMO caregiving pets (single-browser demo seed).
  const demoCaregiver = readMemberships().filter(
    (m) => m.accountId === acct.id && m.role === "caregiver"
  );
  return [...owned, ...demoCaregiver];
}

/** The diary id this account owns (the owner-app has exactly one), or null. */
async function ownedDiaryId(): Promise<string | null> {
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("membership")
    .select("diary_id")
    .eq("account_id", user.id)
    .eq("role", "owner")
    .maybeSingle();
  return data?.diary_id ?? null;
}

/* ---- diary read/write (Supabase, ticket 02) ------------------------------ */

/** A raw `data:` URL from a freshly-picked file, vs. an already-stored one. */
function isDataUrl(v: string | null): boolean {
  return !!v && v.startsWith("data:");
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; contentType: string; ext: string } {
  const [header, base64] = dataUrl.split(",");
  const contentType = header.slice(5, header.indexOf(";"));
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = contentType === "application/pdf" ? "pdf" : contentType.split("/")[1] || "jpg";
  return { blob: new Blob([bytes], { type: contentType }), contentType, ext };
}

/**
 * Resolve a form field's photo/certificate value into a Storage path to save.
 * Returns `undefined` when the value is just the already-resolved URL echoed
 * back unchanged (no upload needed), `null` for an explicit removal, or the
 * new object's path after uploading a freshly-picked `data:` URL.
 */
async function resolveUpload(
  bucket: "pet-photos" | "rabies-certificates",
  diaryId: string,
  value: string | null
): Promise<string | null | undefined> {
  if (value === null) return null;
  if (!isDataUrl(value)) return undefined;
  const { blob, contentType, ext } = dataUrlToBlob(value);
  const path = `${diaryId}/${bucket === "pet-photos" ? "photo" : "certificate"}.${ext}`;
  const supabase = supabaseBrowser();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType, upsert: true });
  if (error) throw error;
  return path;
}

async function resolveReadUrl(
  bucket: "pet-photos" | "rabies-certificates",
  path: string
): Promise<string> {
  const supabase = supabaseBrowser();
  if (bucket === "pet-photos") {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? "";
}

type DiaryRow = {
  id: string;
  name: string;
  species: Species;
  breed: string;
  age_label: string;
  weight_kg: number | null;
  photo_url: string | null;
  quirks: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  vet_clinic: string | null;
  neuter_status: NeuterStatus;
  registered: boolean;
  rabies_vaccinated: boolean;
  rabies_certificate_url: string | null;
  rabies_expiry: string | null;
  current_food: string | null;
  coat_type: string | null;
  created_at: string;
};

/** Map a `diary` table row to the seam's Diary shape (core fields only — the
 *  caller overlays whatever tickets 03/04/07/08 haven't moved off the mock). */
async function mapDiaryRow(row: DiaryRow): Promise<Diary> {
  const photoUrl = row.photo_url ? await resolveReadUrl("pet-photos", row.photo_url) : null;
  const certUrl = row.rabies_certificate_url
    ? await resolveReadUrl("rabies-certificates", row.rabies_certificate_url)
    : null;
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    ageLabel: row.age_label,
    weightKg: row.weight_kg,
    photoUrl,
    quirks: row.quirks,
    vet:
      row.vet_name || row.vet_phone || row.vet_clinic
        ? { name: row.vet_name ?? "", phone: row.vet_phone ?? "", clinic: row.vet_clinic ?? "" }
        : null,
    neuterStatus: row.neuter_status,
    registered: row.registered,
    rabies: row.rabies_vaccinated
      ? { certificateUrl: certUrl, expiry: row.rabies_expiry }
      : null,
    currentFood: row.current_food,
    coatType: row.coat_type,
    dietPlan: null,
    groomingGuide: null,
    feedingLog: [],
    handover: { token: null, createdAt: null },
    createdAt: row.created_at,
  };
}

/** The signed-in owner's pet diary, or null before they've created it (→ /create). */
export async function getDiary(): Promise<Diary | null> {
  const id = await ownedDiaryId();
  if (!id) return null;
  return getDiaryById(id);
}

export async function hasDiary(): Promise<boolean> {
  return (await getDiary()) !== null;
}

/** The core fields the create/edit form collects. */
export interface DiaryCore {
  name: string;
  species: Species;
  breed: string;
  ageLabel: string;
  weightKg: number | null;
  photoUrl: string | null;
}

/** Create the owner's diary and bind them to it as owner. Requires an account. */
export async function createDiary(core: DiaryCore): Promise<Diary> {
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first.");

  const { data: row, error } = await supabase
    .from("diary")
    .insert({
      name: core.name,
      species: core.species,
      breed: core.breed,
      age_label: core.ageLabel,
      weight_kg: core.weightKg,
    })
    .select()
    .single();
  if (error || !row) throw error ?? new Error("Could not create the diary.");

  const { error: memErr } = await supabase
    .from("membership")
    .insert({ account_id: user.id, diary_id: row.id, role: "owner" });
  if (memErr) throw memErr;

  if (core.photoUrl) {
    const path = await resolveUpload("pet-photos", row.id, core.photoUrl);
    if (path) await supabase.from("diary").update({ photo_url: path }).eq("id", row.id);
  }

  write(NUDGE_KEY, false); // fresh pet → an active completeness nudge
  return (await getDiaryById(row.id))!;
}

/** Merge a patch into the existing diary (edit); null if none exists yet. */
export async function updateDiary(patch: Partial<Diary>): Promise<Diary | null> {
  const cur = await getDiary();
  if (!cur) return null;
  const supabase = supabaseBrowser();

  const updates: Record<string, unknown> = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.species !== undefined) updates.species = patch.species;
  if (patch.breed !== undefined) updates.breed = patch.breed;
  if (patch.ageLabel !== undefined) updates.age_label = patch.ageLabel;
  if (patch.weightKg !== undefined) updates.weight_kg = patch.weightKg;
  if (patch.quirks !== undefined) updates.quirks = patch.quirks;
  if (patch.vet !== undefined) {
    updates.vet_name = patch.vet?.name ?? null;
    updates.vet_phone = patch.vet?.phone ?? null;
    updates.vet_clinic = patch.vet?.clinic ?? null;
  }
  if (patch.neuterStatus !== undefined) updates.neuter_status = patch.neuterStatus;
  if (patch.registered !== undefined) updates.registered = patch.registered;
  if (patch.currentFood !== undefined) updates.current_food = patch.currentFood;
  if (patch.coatType !== undefined) updates.coat_type = patch.coatType;

  if (patch.photoUrl !== undefined) {
    const resolved = await resolveUpload("pet-photos", cur.id, patch.photoUrl);
    if (resolved !== undefined) updates.photo_url = resolved;
  }
  if (patch.rabies !== undefined) {
    updates.rabies_vaccinated = patch.rabies != null;
    updates.rabies_expiry = patch.rabies?.expiry ?? null;
    const resolved = await resolveUpload(
      "rabies-certificates",
      cur.id,
      patch.rabies?.certificateUrl ?? null
    );
    if (resolved !== undefined) updates.rabies_certificate_url = resolved;
  }

  const { error } = await supabase.from("diary").update(updates).eq("id", cur.id);
  if (error) throw error;
  return getDiaryById(cur.id);
}

/* ---- feeding confirm (diary-id-addressed) ------------------------------- */

/*
 * Feeding mutations are addressed by diary id, not "the signed-in owner's one
 * diary" — a Caregiver confirms a feed on a pet they don't own (via the same
 * FeedingTap, keyed by that pet's id). The owner hub passes its own diary's id,
 * so the owner path is unchanged. Every write still goes through writeDiary.
 */

/** Today's confirm, if one exists (there is at most one per day). Pure — no I/O. */
export function todayEntry(diary: Diary): FeedingEntry | undefined {
  const t = today();
  return diary.feedingLog.find((e) => e.date === t);
}

/** Idempotent confirm on a specific diary — the first confirm of the day wins. */
export async function confirmFeedingFor(diaryId: string, by: string): Promise<Diary | null> {
  const cur = await getDiaryById(diaryId);
  if (!cur) return null;
  if (todayEntry(cur)) return cur;

  if (await realMembershipRole(diaryId)) {
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("feeding_entry").insert({
        diary_id: diaryId,
        fed_on: today(),
        by_account_id: user.id,
        by_name: by,
      });
      // Idempotent per (diary_id, fed_on) — a duplicate insert from a second
      // tap/device is expected and not an error.
      if (error && error.code !== "23505") throw error;
      return getDiaryById(diaryId);
    }
  }

  const next: Diary = {
    ...cur,
    feedingLog: [...cur.feedingLog, { date: today(), by }],
  };
  writeDiary(next);
  return next;
}

/** Reverse today's confirm on a specific diary (same-day mistap). */
export async function undoFeedingFor(diaryId: string): Promise<Diary | null> {
  const cur = await getDiaryById(diaryId);
  if (!cur) return null;
  const t = today();

  if (await realMembershipRole(diaryId)) {
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("feeding_entry")
      .delete()
      .eq("diary_id", diaryId)
      .eq("fed_on", t);
    if (error) throw error;
    return getDiaryById(diaryId);
  }

  const next: Diary = {
    ...cur,
    feedingLog: cur.feedingLog.filter((e) => e.date !== t),
  };
  writeDiary(next);
  return next;
}

/** Attach/clear the optional deviation note on today's confirm of a diary. */
export async function setTodayNoteFor(diaryId: string, note: string): Promise<Diary | null> {
  const cur = await getDiaryById(diaryId);
  if (!cur) return null;
  const t = today();
  const trimmed = note.trim();

  if (await realMembershipRole(diaryId)) {
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("feeding_entry")
      .update({ note: trimmed || null })
      .eq("diary_id", diaryId)
      .eq("fed_on", t);
    if (error) throw error;
    return getDiaryById(diaryId);
  }

  const next: Diary = {
    ...cur,
    feedingLog: cur.feedingLog.map((e) =>
      e.date === t ? { ...e, note: trimmed || undefined } : e
    ),
  };
  writeDiary(next);
  return next;
}

/** Confirms, most recent first. Pure — no I/O. */
export function feedingHistory(diary: Diary): FeedingEntry[] {
  return [...diary.feedingLog].sort((a, b) => b.date.localeCompare(a.date));
}

/*
 * Feed reminders are per person per pet: "remind ME if I forget" is a personal
 * preference, so the owner and each caregiver on the same pet control their own
 * — keyed by (accountId, diaryId), not diaryId alone.
 */
function reminderKey(accountId: string, diaryId: string): string {
  return `${accountId}::${diaryId}`;
}

function readFeedReminders(): Record<string, boolean> {
  return read<Record<string, boolean>>(FEED_REMINDERS_KEY) ?? {};
}

export async function getFeedReminderFor(diaryId: string): Promise<boolean> {
  const acct = await getAccount();
  if (!acct) return false;
  return readFeedReminders()[reminderKey(acct.id, diaryId)] === true;
}

export async function setFeedReminderFor(diaryId: string, on: boolean): Promise<void> {
  const acct = await getAccount();
  if (!acct) return;
  const all = readFeedReminders();
  all[reminderKey(acct.id, diaryId)] = on;
  write(FEED_REMINDERS_KEY, all);
}

/** The reminder condition ticket 09/backend will consume: opted in AND not fed. */
export async function feedReminderDue(diary: Diary): Promise<boolean> {
  return (await getFeedReminderFor(diary.id)) && !isFedToday(diary);
}

/* ---- diet plan (ticket 04) ---------------------------------------------- */

/**
 * The AI generation boundary — a pure function of the diary + current food.
 * Canned/templated now; later the diet-service's insides call the AI Gateway
 * and return the same DietPlan shape. The UI never asserts on the *content*.
 * Pure — no I/O — kept synchronous; requestDietPlan (I/O) calls this and,
 * per ticket 07, will keep calling it as the AI-unavailable fallback.
 */
export function generateDietPlan(diary: Diary, currentFood: string): DietPlan {
  const w = diary.weightKg ?? (diary.species === "dog" ? 15 : 4);
  const perKg = diary.species === "dog" ? 20 : 22;
  const grams = Math.max(30, Math.round((w * perKg) / 10) * 10);
  const young = /month|puppy|kitten|^0/i.test(diary.ageLabel);
  const food = currentFood.trim() || `a complete ${diary.species} food`;
  return {
    createdAt: new Date().toISOString(),
    currentFood: food,
    summary: `Keep ${diary.name} on ${food}, measured by weight rather than by eye.`,
    portionPerDay: `About ${grams} g of dry food a day`,
    meals: young ? "3 smaller meals a day" : "2 meals, morning and evening",
    tips: [
      "Weigh portions with a kitchen scale. Cups drift by a lot.",
      "If you add wet food, cut the dry amount to match.",
      "Keep treats under ~10% of the day's food.",
      `Re-check the amount whenever ${diary.name}'s weight changes.`,
    ],
    source: "templated",
  };
}

/**
 * Generate + save a diet plan. Tries the server AI route first (Gemini, keys
 * server-only); on any failure — outage, guardrail rejection, non-2xx — falls
 * back to the templated generator, so the screen never hard-depends on the
 * model (ticket 07). `source` records which path produced it.
 */
export async function requestDietPlan(currentFood: string): Promise<Diary | null> {
  const cur = await getDiary();
  if (!cur) return null;
  const food = currentFood.trim() || `a complete ${cur.species} food`;

  let plan: DietPlan | null = null;
  try {
    const res = await fetch("/api/diet-plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        species: cur.species,
        breed: cur.breed,
        ageLabel: cur.ageLabel,
        weightKg: cur.weightKg,
        currentFood: food,
      }),
    });
    if (res.ok) {
      const { plan: p } = (await res.json()) as {
        plan: { summary: string; portionPerDay: string; meals: string; tips: string[] };
      };
      plan = {
        createdAt: new Date().toISOString(),
        currentFood: food,
        summary: p.summary,
        portionPerDay: p.portionPerDay,
        meals: p.meals,
        tips: p.tips,
        source: "ai",
      };
    }
  } catch {
    // network error — fall through to the templated plan below
  }

  if (!plan) plan = generateDietPlan(cur, food); // templated fallback
  return persistDietPlan(cur.id, food, plan);
}

/** The manual alternative to AI generation — the owner writes the plan themselves. */
export async function saveDietPlan(fields: {
  currentFood: string;
  portionPerDay: string;
  meals: string;
  summary?: string;
  tips?: string[];
}): Promise<Diary | null> {
  const cur = await getDiary();
  if (!cur) return null;
  const food = fields.currentFood.trim() || `a complete ${cur.species} food`;
  const plan: DietPlan = {
    createdAt: new Date().toISOString(),
    currentFood: food,
    summary: fields.summary?.trim() || `${cur.name}'s feeding plan, set by you.`,
    portionPerDay: fields.portionPerDay.trim(),
    meals: fields.meals.trim(),
    tips: (fields.tips ?? []).map((t) => t.trim()).filter(Boolean),
    source: "manual",
  };
  return persistDietPlan(cur.id, food, plan);
}

/**
 * The single write path for a diet plan. A real Owner's plan is a new row in the
 * Supabase `diet_plan` table (latest row = current, ticket 07) and the diary's
 * current_food is updated alongside; a demo/mock diary keeps the localStorage
 * shadow. Returns the refreshed diary either way.
 */
async function persistDietPlan(
  diaryId: string,
  currentFood: string,
  plan: DietPlan
): Promise<Diary | null> {
  if (await realMembershipRole(diaryId)) {
    const supabase = supabaseBrowser();
    await supabase.from("diary").update({ current_food: currentFood }).eq("id", diaryId);
    const { error } = await supabase.from("diet_plan").insert({
      diary_id: diaryId,
      current_food: currentFood,
      summary: plan.summary,
      portion_per_day: plan.portionPerDay,
      meals: plan.meals,
      tips: plan.tips,
      source: plan.source,
    });
    if (error) throw error;
    return getDiaryById(diaryId);
  }
  const cur = await getDiaryById(diaryId);
  if (!cur) return null;
  const next: Diary = { ...cur, currentFood, dietPlan: plan };
  writeDiary(next);
  return next;
}

/* ---- grooming guide (ticket 06) ----------------------------------------- */

/** Pure — no I/O — same fallback-generator reasoning as generateDietPlan. */
export function generateGroomingGuide(diary: Diary, coatType: string): GroomingGuide {
  const coat =
    coatType.trim() || (diary.species === "dog" ? "medium double coat" : "short coat");
  const c = coat.toLowerCase();
  const long = /long|double|curl|poodle|doodle|fluffy/.test(c);
  const short = /short|smooth|sleek/.test(c);
  const freq = long ? 6 : short ? 12 : 8;
  const brushing = long
    ? "every day or two"
    : short
      ? "once a week"
      : "two or three times a week";
  const professional =
    diary.species === "cat"
      ? long
        ? `Most cats self-groom, but a ${coat} mats easily, so a professional groom about every ${freq} weeks helps.`
        : "Cats mostly self-groom; a professional visit is only needed if the coat gets matted."
      : `A professional groom about every ${freq} weeks keeps the coat and nails in shape.`;
  return {
    createdAt: new Date().toISOString(),
    coatType: coat,
    frequencyWeeks: freq,
    summary: `${diary.name}'s ${coat} does best with a steady rhythm, and most of it you can do at home.`,
    routine: [
      `Brush ${brushing} to stop mats and cut shedding.`,
      "Bath every 4–6 weeks, or when actually dirty. Over-washing dries the skin.",
      "Trim nails every 3–4 weeks; a click on the floor means they're long.",
      "Check ears and teeth weekly.",
    ],
    professional,
  };
}

export async function requestGroomingGuide(coatType: string): Promise<Diary | null> {
  const cur = await getDiary();
  if (!cur) return null;
  const guide = generateGroomingGuide(cur, coatType);
  const next: Diary = { ...cur, coatType: guide.coatType, groomingGuide: guide };
  writeDiary(next);
  return next;
}

/** The manual alternative to AI generation — the owner writes the guide themselves. */
export async function saveGroomingGuide(fields: {
  coatType: string;
  frequencyWeeks: number;
  routine?: string[];
  professional?: string;
  summary?: string;
}): Promise<Diary | null> {
  const cur = await getDiary();
  if (!cur) return null;
  const coat = fields.coatType.trim() || (cur.species === "dog" ? "medium coat" : "short coat");
  const freq =
    Number.isFinite(fields.frequencyWeeks) && fields.frequencyWeeks > 0
      ? Math.round(fields.frequencyWeeks)
      : 8;
  const guide: GroomingGuide = {
    createdAt: new Date().toISOString(),
    coatType: coat,
    frequencyWeeks: freq,
    summary: fields.summary?.trim() || `${cur.name}'s grooming rhythm, set by you.`,
    routine: (fields.routine ?? []).map((t) => t.trim()).filter(Boolean),
    professional:
      fields.professional?.trim() || `A professional groom about every ${freq} weeks helps.`,
  };
  const next: Diary = { ...cur, coatType: coat, groomingGuide: guide };
  writeDiary(next);
  return next;
}

export async function getGroomReminder(): Promise<boolean> {
  return read<boolean>(GROOM_REMINDER_KEY) === true;
}

export async function setGroomReminder(on: boolean): Promise<void> {
  write(GROOM_REMINDER_KEY, on);
}

/* ---- handover link (ticket 04: real; ticket 05 adds revoke's Past Caregiver retention) --- */

/** Issue a fresh standing link token (owner action; the old one dies). */
export async function regenerateHandoverLink(): Promise<Diary | null> {
  const cur = await getDiary();
  if (!cur) return null;
  const supabase = supabaseBrowser();
  // One live link per pet — revoke whatever's active before issuing the new one.
  await supabase
    .from("handover_token")
    .update({ state: "revoked", revoked_at: new Date().toISOString() })
    .eq("diary_id", cur.id)
    .eq("state", "active");
  const token = "h_" + Math.random().toString(36).slice(2, 12);
  const referralCode = handoverCode(token).replace(/-/g, "").toLowerCase();
  const { error } = await supabase
    .from("handover_token")
    .insert({ diary_id: cur.id, token, referral_code: referralCode, state: "active" });
  if (error) throw error;
  return getDiaryById(cur.id);
}

/** Generate a link only if none exists yet. */
export async function ensureHandoverLink(): Promise<Diary | null> {
  const cur = await getDiary();
  if (!cur) return null;
  return cur.handover.token ? cur : regenerateHandoverLink();
}

/** Whether a diary has the safety basics a Caregiver needs, and what is missing. */
export interface HandoverReadiness {
  ready: boolean;
  /** Each gap names what to add and where the Owner fixes it. */
  missing: { label: string; where: "edit" | "diet" }[];
}

/**
 * Handover-readiness (ticket 06): the basics a Caregiver needs before a pet is
 * handed over — the safety records AND a diet plan, so a sitter always has
 * feeding guidance (option b, 2026-09-15). Reports which required pieces are
 * still missing, each tagged with where the Owner fixes it, so the Circle can
 * gate link creation, name the gaps, and link straight to the right page. These
 * already exist on the Diary shape — validation + a completion prompt, not a
 * schema change — and it is called ONLY at handover creation / regeneration.
 * Pure — no I/O — operates on an already-loaded Diary.
 *
 * ⚠️ Model limitation: `rabies` is null both when a pet is not vaccinated AND
 * when it has not been recorded, so "rabies status" here means "a rabies record
 * exists". An owner of a genuinely-unvaccinated pet cannot satisfy this without a
 * tri-state rabies field (vaccinated / not / unknown) — a future change.
 */
export function handoverReadiness(diary: Diary): HandoverReadiness {
  const missing: HandoverReadiness["missing"] = [];
  if (!diary.breed.trim()) missing.push({ label: "breed", where: "edit" });
  if (diary.rabies == null) missing.push({ label: "rabies status", where: "edit" });
  if (diary.vet == null) missing.push({ label: "vet contact", where: "edit" });
  if (!diary.quirks || !diary.quirks.trim())
    missing.push({ label: "anything a caregiver should know", where: "edit" });
  if (diary.dietPlan == null) missing.push({ label: "a diet plan", where: "diet" });
  return { ready: missing.length === 0, missing };
}

/** What the sign-in gate is allowed to know about a shared diary: its id and the
 *  pet's name — nothing else. */
export interface HandoverTarget {
  diaryId: string;
  petName: string;
  /**
   * Whether the pet already has a Caregiver (ADR-0007: one at a time). Computed
   * server-side by /api/handover (service role) so a signed-out / non-owner
   * visitor can be shown "already taken" up front — they cannot read the
   * caregiver membership themselves under RLS.
   */
  taken: boolean;
}

/** A stable-per-browser anonymous id, so the public route can dedupe repeat opens. */
function recipientKey(): string {
  if (!hasWindow()) return "unknown";
  let id = read<string>(RECIPIENT_KEY);
  if (!id) {
    id = "r_" + Math.random().toString(36).slice(2, 12);
    write(RECIPIENT_KEY, id);
  }
  return id;
}

/**
 * Resolve a handover token to only the pet's id and name, or null if unknown
 * / revoked (ticket 04) — via the public, service-role /api/handover route,
 * the ONE capability that genuinely needs no account and no session (ADR-0003).
 * Deliberately does NOT return the diary: under ADR-0004 no diary content is
 * readable without an account, so this route physically cannot leak it.
 * Callers that hold a membership read the diary by id via getDiaryById / the
 * caregiver view. Also records this visit as a handover_open server-side.
 */
export async function resolveHandoverGate(token: string): Promise<HandoverTarget | null> {
  if (!token) return null;
  const res = await fetch(
    `/api/handover?token=${encodeURIComponent(token)}&recipient=${encodeURIComponent(recipientKey())}`
  );
  if (!res.ok) return null;
  const { target } = (await res.json()) as { target: HandoverTarget | null };
  return target;
}

/**
 * The human-readable Referral code for a link — the SAME token, just formatted
 * to read aloud (grouped, upper-case, no `h_` prefix). Not a second credential:
 * regenerate/revoke change the token and the code changes with it. Pure — no I/O.
 */
export function handoverCode(token: string | null): string {
  if (!token) return "";
  const core = token.replace(/^h_/, "").toUpperCase();
  return core.replace(/(.{4})(?=.)/g, "$1-");
}

/**
 * Resolve a typed Referral code (any spacing/case) back to its link token, or
 * null — via the same public route as resolveHandoverGate. Doesn't itself log
 * an open: callers always follow up with resolveHandoverGate(token), which
 * does, so logging here too would double-count the same visit.
 */
export async function resolveCode(code: string): Promise<string | null> {
  if (!code.trim()) return null;
  const res = await fetch(`/api/handover?code=${encodeURIComponent(code)}`);
  if (!res.ok) return null;
  const { token } = (await res.json()) as { token: string | null };
  return token;
}

/**
 * The pet's single current Caregiver (ADR-0007: one at a time), or null.
 * Owner-only in practice: RLS (0005) lets the diary's Owner read the caregiver's
 * membership + account; a non-owner caller gets null (they can't see who else
 * helps). Preventing a second caregiver relies on the DB's 1:1 unique index,
 * not on this read.
 */
export async function diaryCaregiver(diaryId: string): Promise<Account | null> {
  const supabase = supabaseBrowser();
  const { data: m } = await supabase
    .from("membership")
    .select("account_id")
    .eq("diary_id", diaryId)
    .eq("role", "caregiver")
    .maybeSingle();
  if (!m) return null;
  const { data: a } = await supabase
    .from("account")
    .select("id,name,email")
    .eq("id", m.account_id)
    .maybeSingle();
  return a ? { id: a.id, name: a.name, email: a.email } : null;
}

/** The signed-in account's role on a given diary, or null if they have none. */
/**
 * This account's REAL (Supabase) membership role on a diary, or null — never
 * falls back to the localStorage mock. Shared by roleOnDiary and the feeding
 * functions (ticket 03): a diary this account has real membership on gets its
 * Feeding confirms stored server-side (genuinely cross-device); everything
 * else keeps today's localStorage-shadow behavior until tickets 04/06 move
 * Caregiver membership onto Supabase too.
 */
async function realMembershipRole(diaryId: string): Promise<Role | null> {
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("membership")
    .select("role")
    .eq("account_id", user.id)
    .eq("diary_id", diaryId)
    .maybeSingle();
  return (data?.role as Role | undefined) ?? null;
}

export async function roleOnDiary(diaryId: string): Promise<Role | null> {
  const real = await realMembershipRole(diaryId);
  if (real) return real;
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // Real caregiver membership is now in Supabase (realMembershipRole, above).
  // The only rows left in the localStorage mock are DEMO caregiving pets.
  const m = readMemberships().find((x) => x.accountId === user.id && x.diaryId === diaryId);
  return m?.role ?? null;
}

/**
 * Read any diary by id (e.g. the caregiver view resolves a pet it has a
 * membership on). Tries Supabase first (a real, owner-created diary); a
 * miss falls back to the localStorage mock (demo diaries). For a real diary,
 * overlays the localStorage "shadow" entry's diet/grooming/feeding/handover
 * fields — those tables don't exist until tickets 03/04/07/08 — on top of
 * the Supabase-sourced core fields.
 */
export async function getDiaryById(diaryId: string): Promise<Diary | null> {
  ensureMigrated();
  const supabase = supabaseBrowser();
  const { data: row } = await supabase.from("diary").select("*").eq("id", diaryId).maybeSingle();
  if (row) {
    const mapped = await mapDiaryRow(row as DiaryRow);
    const shadow = readDiaries()[diaryId];
    // A real member's downstream data lives in Postgres (cross-device); a
    // demo/mock diary keeps the localStorage shadow. Computed once here.
    const isMember = !!(await realMembershipRole(diaryId));

    // Ticket 03: Feeding confirms.
    let feedingLog = shadow?.feedingLog ?? [];
    if (isMember) {
      const { data: entries } = await supabase
        .from("feeding_entry")
        .select("fed_on,by_name,note")
        .eq("diary_id", diaryId);
      feedingLog = (entries ?? []).map((e) => ({
        date: e.fed_on,
        by: e.by_name,
        note: e.note ?? undefined,
      }));
    }

    // Ticket 04: the Handover link.
    let handover: HandoverState = shadow?.handover ?? { token: null, createdAt: null };
    if (isMember) {
      const { data: tokenRow } = await supabase
        .from("handover_token")
        .select("token,created_at")
        .eq("diary_id", diaryId)
        .eq("state", "active")
        .maybeSingle();
      handover = tokenRow
        ? { token: tokenRow.token, createdAt: tokenRow.created_at }
        : { token: null, createdAt: null };
    }

    // Ticket 07: the diet plan — latest row is the current plan.
    let dietPlan: DietPlan | null = shadow?.dietPlan ?? null;
    if (isMember) {
      const { data: dp } = await supabase
        .from("diet_plan")
        .select("current_food,summary,portion_per_day,meals,tips,source,created_at")
        .eq("diary_id", diaryId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      dietPlan = dp
        ? {
            createdAt: dp.created_at,
            currentFood: dp.current_food,
            summary: dp.summary,
            portionPerDay: dp.portion_per_day,
            meals: dp.meals,
            tips: dp.tips ?? [],
            source: dp.source as DietSource,
          }
        : null;
    }

    return {
      ...mapped,
      dietPlan,
      groomingGuide: shadow?.groomingGuide ?? null,
      feedingLog,
      handover,
    };
  }
  return readDiaries()[diaryId] ?? null;
}

/**
 * Bind the signed-in account to a shared diary as a Caregiver (slice 04).
 * - Returns null if signed out, or the token is revoked / unknown.
 * - Idempotent: if already a caregiver, returns the existing membership (no
 *   duplicate). In practice the gate redirects existing caregivers away before
 *   the join is ever offered, so this is a belt-and-braces guard.
 * - NEVER binds the diary's owner as a caregiver of their own pet: roleOnDiary
 *   is first-match, so a second membership would make owner-vs-caregiver routing
 *   depend on array order. An owner opening their own link stays owner-only.
 */
export async function joinAsCaregiver(token: string): Promise<Membership | null> {
  const acct = await getAccount();
  if (!acct) return null;
  const target = await resolveHandoverGate(token);
  if (!target) return null;
  // Never bind the diary's Owner as a Caregiver of their own pet (roleOnDiary is
  // first-match, so a second row would make owner-vs-caregiver routing depend on
  // order). Idempotent: an existing Caregiver membership is returned unchanged.
  const mine = await realMembershipRole(target.diaryId);
  if (mine === "owner") return null;
  if (mine === "caregiver") {
    return { accountId: acct.id, diaryId: target.diaryId, role: "caregiver" };
  }
  const supabase = supabaseBrowser();
  // 1:1 (ADR-0007) is enforced by the `membership_one_caregiver_per_diary`
  // partial unique index: a unique violation means the spot is already taken by
  // someone else. A non-owner can't read that row (RLS), so the insert conflict —
  // not a pre-check — is what rejects the second caregiver.
  const { error } = await supabase
    .from("membership")
    .insert({ account_id: acct.id, diary_id: target.diaryId, role: "caregiver" });
  if (error) return null;
  return { accountId: acct.id, diaryId: target.diaryId, role: "caregiver" };
}

/**
 * Whole-link revoke — ends access for everyone at once. The token dies AND every
 * Caregiver bound to THIS diary is unbound (their /care view already stops on the
 * dead token; this also clears the rows so the caregiver lists stay honest). The
 * owner membership and every OTHER diary's memberships are untouched.
 *
 * ADR-0006: revoke no longer erases the Caregiver — before dropping their
 * membership it retains a private, access-less Past Caregiver record for the
 * Owner (history + a future Rating). Access is genuinely gone (no membership);
 * only the Owner's memory of them remains.
 */
export async function revokeHandoverLink(): Promise<Diary | null> {
  const cur = await getDiary();
  if (!cur) return null;
  const supabase = supabaseBrowser();
  const { error } = await supabase
    .from("handover_token")
    .update({ state: "revoked", revoked_at: new Date().toISOString() })
    .eq("diary_id", cur.id)
    .eq("state", "active");
  if (error) throw error;
  // Unbind the real (Supabase) Caregiver: capture who's ending first (owner-reads
  // RLS, 0005), retain them as a Past Caregiver (Supabase, 0007), then delete the
  // membership (owner-ends RLS). Access is genuinely gone; only the Owner's
  // private Past Caregiver record + any Rating remain.
  const { data: ending } = await supabase
    .from("membership")
    .select("account_id")
    .eq("diary_id", cur.id)
    .eq("role", "caregiver");
  await retainPastCaregivers(
    cur.id,
    (ending ?? []).map((m) => m.account_id)
  );
  await supabase
    .from("membership")
    .delete()
    .eq("diary_id", cur.id)
    .eq("role", "caregiver");
  return getDiaryById(cur.id);
}

/**
 * Record each ending Caregiver as a Past Caregiver of the diary (ADR-0006). One
 * record per (account, diary): if they were revoked before, the timestamp moves
 * to this most-recent access-end rather than duplicating them.
 */
async function retainPastCaregivers(diaryId: string, accountIds: string[]): Promise<void> {
  if (accountIds.length === 0) return;
  const supabase = supabaseBrowser();
  const now = new Date().toISOString();
  // One record per (diary, account): re-revoking a returning helper moves
  // ended_at forward rather than duplicating, via the (diary_id, account_id)
  // unique constraint. Written by the Owner during revoke (owner-inserts RLS).
  await supabase.from("past_caregiver").upsert(
    accountIds.map((accountId) => ({ diary_id: diaryId, account_id: accountId, ended_at: now })),
    { onConflict: "diary_id,account_id" }
  );
}

/**
 * The Owner's private Past Caregivers for a diary (ADR-0006) — Accounts whose
 * access ended, resolved to names, most-recent first. Anyone who has since
 * rejoined (holds a live Caregiver membership again) is excluded: they are a
 * current Caregiver, not a past one. Rendered by ticket 05 on the Circle.
 */
export async function pastCaregivers(
  diaryId: string
): Promise<{ account: Account; endedAt: string }[]> {
  const supabase = supabaseBrowser();
  const { data: rows } = await supabase
    .from("past_caregiver")
    .select("account_id, ended_at")
    .eq("diary_id", diaryId)
    .order("ended_at", { ascending: false });
  if (!rows || rows.length === 0) return [];
  // Exclude anyone who has since rejoined as a live Caregiver — they're current,
  // not past (owner-reads RLS lets the Owner see the current caregiver row).
  const { data: live } = await supabase
    .from("membership")
    .select("account_id")
    .eq("diary_id", diaryId)
    .eq("role", "caregiver");
  const liveIds = new Set((live ?? []).map((m) => m.account_id));
  const past = rows.filter((r) => !liveIds.has(r.account_id));
  if (past.length === 0) return [];
  // Resolve names (Owner reads a past caregiver's account via 0007 RLS).
  const { data: accts } = await supabase
    .from("account")
    .select("id,name,email")
    .in("id", past.map((r) => r.account_id));
  const byId = new Map((accts ?? []).map((a) => [a.id, a as Account]));
  return past
    .map((r) => {
      const account = byId.get(r.account_id);
      return account ? { account, endedAt: r.ended_at } : null;
    })
    .filter((x): x is { account: Account; endedAt: string } => !!x);
}

/* ---- private Ratings (owner → caregiver, ticket 07) --------------------- */

/**
 * The signed-in Owner's private Rating of a Caregiver on a diary, or null. Reads
 * against the CURRENT account as the owner, so a Caregiver calling this only ever
 * sees ratings THEY wrote — never the owner's rating of them. That is what keeps
 * a Rating private by construction (ADR-0005; CONTEXT.md).
 */
export async function getRating(
  caregiverAccountId: string,
  diaryId: string
): Promise<Rating | null> {
  const acct = await getAccount();
  if (!acct) return null;
  const supabase = supabaseBrowser();
  // RLS scopes `rating` to owner_account_id = auth.uid(), so a Caregiver can
  // never read the Owner's rating of them — private by construction (ADR-0005).
  // The explicit owner filter is belt-and-braces.
  const { data } = await supabase
    .from("rating")
    .select("owner_account_id, caregiver_account_id, diary_id, stars, note, updated_at")
    .eq("owner_account_id", acct.id)
    .eq("caregiver_account_id", caregiverAccountId)
    .eq("diary_id", diaryId)
    .maybeSingle();
  if (!data) return null;
  return {
    ownerAccountId: data.owner_account_id,
    caregiverAccountId: data.caregiver_account_id,
    diaryId: data.diary_id,
    stars: data.stars,
    note: data.note ?? undefined,
    updatedAt: data.updated_at,
  };
}

/**
 * Set or update the current Owner's Rating of a Caregiver on a diary. Upsert:
 * one Rating per (owner, caregiver, diary), so editing overwrites the stars/note
 * rather than adding a second. Stars are clamped to 1-5; an empty note is
 * dropped. The record is keyed by account ids (not the link), so it survives a
 * revoke and re-share.
 */
export async function setRating(
  caregiverAccountId: string,
  diaryId: string,
  stars: number,
  note: string
): Promise<Rating | null> {
  const acct = await getAccount();
  if (!acct) return null;
  const clean = Math.max(1, Math.min(5, Math.round(stars)));
  const trimmed = note.trim();
  const supabase = supabaseBrowser();
  // Upsert on (owner, caregiver, diary): editing overwrites stars/note rather
  // than adding a second row. Keyed by account ids, so it survives revoke and
  // re-share. Owner-scoped by RLS (owner_account_id = auth.uid()).
  const { error } = await supabase.from("rating").upsert(
    {
      owner_account_id: acct.id,
      caregiver_account_id: caregiverAccountId,
      diary_id: diaryId,
      stars: clean,
      note: trimmed || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_account_id,caregiver_account_id,diary_id" }
  );
  if (error) return null;
  return getRating(caregiverAccountId, diaryId);
}

/* ---- caregiving ("Helping with") + demo seeding (slice 05) -------------- */

/** Diaries the signed-in account helps with (caregiver role) — real + demo. */
export async function caregivingDiaries(): Promise<Diary[]> {
  const acct = await getAccount();
  if (!acct) return [];
  // Real caregiver memberships live in Supabase; demo ones (single-browser mock)
  // still ride localStorage. getMemberships() merges both.
  const ids = (await getMemberships())
    .filter((m) => m.accountId === acct.id && m.role === "caregiver")
    .map((m) => m.diaryId);
  const diaries = await Promise.all(ids.map((id) => getDiaryById(id)));
  return diaries.filter((d): d is Diary => !!d);
}

function buildDemoDiary(
  id: string,
  name: string,
  species: Species,
  breed: string,
  quirks: string,
  plan: { food: string; portionPerDay: string; meals: string },
  groom: { coatType: string; frequencyWeeks: number; brushing: string },
  ownerName: string
): Diary {
  return {
    id,
    name,
    species,
    breed,
    ageLabel: species === "dog" ? "3 years" : "5 years",
    weightKg: species === "dog" ? 12 : 5,
    photoUrl: null,
    quirks,
    vet: null,
    neuterStatus: "none",
    registered: false,
    rabies: null,
    currentFood: plan.food,
    coatType: groom.coatType,
    dietPlan: {
      createdAt: new Date().toISOString(),
      currentFood: plan.food,
      summary: `Keep ${name} on ${plan.food}, measured by weight.`,
      portionPerDay: plan.portionPerDay,
      meals: plan.meals,
      tips: ["Weigh portions with a scale.", "Keep treats to ~10% of the day."],
      source: "templated",
    },
    groomingGuide: {
      createdAt: new Date().toISOString(),
      coatType: groom.coatType,
      frequencyWeeks: groom.frequencyWeeks,
      summary: `${name}'s ${groom.coatType} does best with a steady rhythm, and most of it you can do at home.`,
      routine: [
        `Brush ${groom.brushing} to stop mats and cut shedding.`,
        "Bath every 4–6 weeks, or when actually dirty. Over-washing dries the skin.",
        "Trim nails every 3–4 weeks; a click on the floor means they're long.",
        "Check ears and teeth weekly.",
      ],
      professional:
        species === "cat"
          ? `Most cats self-groom, but a ${groom.coatType} mats easily, so a professional groom about every ${groom.frequencyWeeks} weeks helps.`
          : `A professional groom about every ${groom.frequencyWeeks} weeks keeps the coat and nails in shape.`,
    },
    feedingLog: [{ date: today(), by: ownerName }],
    handover: { token: "h_" + id, createdAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    demo: true,
  };
}

/**
 * Seed 1-2 clearly-marked DEMO caregiving pets for the current account so the
 * "Helping with" section is real to click through in the single-browser mock.
 * Idempotent: no-op once the account holds any caregiver membership (real or
 * demo), so real joins are never shadowed and it never re-seeds.
 */
export async function ensureDemoCaregiving(): Promise<void> {
  const acct = await getAccount();
  if (!acct) return;
  // No-op once the account holds ANY caregiver membership — real (Supabase) or
  // demo (localStorage) — so a real join is never shadowed and demos never
  // re-seed on top of it.
  const alreadyHelps = (await getMemberships()).some(
    (m) => m.accountId === acct.id && m.role === "caregiver"
  );
  if (alreadyHelps) return;
  const mems = readMemberships();

  const demos = [
    buildDemoDiary(
      "demo_mochi",
      "Mochi",
      "cat",
      "Ragdoll",
      "Naps on the windowsill every afternoon. Leave the blind up.",
      { food: "Ocean Fish blend", portionPerDay: "About 70 g of dry food a day", meals: "2 meals" },
      { coatType: "long double coat", frequencyWeeks: 6, brushing: "every day or two" },
      "Priya"
    ),
    buildDemoDiary(
      "demo_waffles",
      "Waffles",
      "dog",
      "Beagle",
      "Will trade anything for a tennis ball. Counter-surfs.",
      { food: "Grain-free chicken", portionPerDay: "About 240 g of dry food a day", meals: "2 meals" },
      { coatType: "short smooth coat", frequencyWeeks: 12, brushing: "once a week" },
      "Marco"
    ),
  ];
  const diaries = readDiaries();
  for (const d of demos) diaries[d.id] = d;
  write(DIARIES_KEY, diaries);
  for (const d of demos) mems.push({ accountId: acct.id, diaryId: d.id, role: "caregiver" });
  write(MEMBERSHIPS_KEY, mems);
}

/* ---- completeness nudge (a UI preference, not diary data) --------------- */

export async function isNudgeDismissed(): Promise<boolean> {
  return read<boolean>(NUDGE_KEY) === true;
}

export async function setNudgeDismissed(dismissed: boolean): Promise<void> {
  write(NUDGE_KEY, dismissed);
}

/* ---- derived view helpers (kept here so screens stay declarative) -------- */
/* All pure — no I/O — operate on an already-loaded Diary/value. */

export function isFedToday(diary: Diary): boolean {
  return diary.feedingLog.some((e) => e.date === today());
}

export type CardStatus = "empty" | "ready" | "attention";

export interface HubCardStatus {
  label: string;
  tone: CardStatus;
}

export function dietStatus(diary: Diary): HubCardStatus {
  return diary.dietPlan
    ? { label: "Ready", tone: "ready" }
    : { label: "Not generated yet", tone: "empty" };
}

export function groomingStatus(diary: Diary): HubCardStatus {
  if (!diary.groomingGuide) return { label: "Not generated yet", tone: "empty" };
  return {
    label: `Every ${diary.groomingGuide.frequencyWeeks} wks`,
    tone: "ready",
  };
}

export function shareStatus(diary: Diary): HubCardStatus {
  if (!diary.handover.token) return { label: "Not shared yet", tone: "empty" };
  return { label: "Link live", tone: "ready" };
}

export interface CompletenessState {
  done: number;
  total: number;
  missing: string[];
}

/** Which optional pieces are still missing (drives ticket 03's nudge). */
export function completeness(diary: Diary): CompletenessState {
  const items: Array<[string, boolean]> = [
    ["quirks", !!diary.quirks],
    ["vet contact", !!diary.vet],
    ["diet plan", !!diary.dietPlan],
    ["grooming guide", !!diary.groomingGuide],
  ];
  const missing = items.filter(([, ok]) => !ok).map(([name]) => name);
  return { done: items.length - missing.length, total: items.length, missing };
}
