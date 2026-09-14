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
 */

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

export interface DietPlan {
  createdAt: string;
  currentFood: string;
  summary: string;
  portionPerDay: string;
  meals: string;
  tips: string[];
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
  /** ISO date the account was first created. Absent on accounts that existed
   *  before this field was added — never backfilled, so its absence is honest. */
  createdAt?: string;
}

/** Binds an Account to a Diary with a role. Roles are per-diary, never global. */
export interface Membership {
  accountId: string;
  diaryId: string;
  role: Role;
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
const FEED_REMINDERS_KEY = "pouncity_feed_reminders_v1"; // { [diaryId]: boolean }
const GROOM_REMINDER_KEY = "pouncity_groom_reminder_v1";
const CIRCLE_KEY = "pouncity_circle_v1"; // { [accountId]: CareProvider[] }
const CARE_REQUESTS_KEY = "pouncity_care_requests_v1"; // { [accountId]: CareRequest[] }

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

/* ---- accounts (mock auth) ----------------------------------------------- */

/** The signed-in account, or null when signed out. `name` is "" until captured. */
export function getAccount(): Account | null {
  ensureMigrated();
  const id = read<string>(CURRENT_ACCOUNT_KEY);
  if (!id) return null;
  return readAccounts()[id] ?? null;
}

/**
 * Sign in by email. Reattaches to the existing account for that email (keeping
 * its id, name, and memberships) rather than minting a new identity — so
 * sign-out → sign-in returns to the same pet. Only a genuinely new email mints
 * a fresh account (name empty, to be captured).
 */
export function signIn(email: string): Account {
  ensureMigrated();
  const clean = email.trim();
  const accounts = readAccounts();
  const existing = Object.values(accounts).find(
    (a) => a.email.toLowerCase() === clean.toLowerCase()
  );
  const account: Account = existing ?? {
    id: "a_" + Math.random().toString(36).slice(2, 9),
    name: "",
    email: clean,
    createdAt: new Date().toISOString(),
  };
  accounts[account.id] = account;
  write(ACCOUNTS_KEY, accounts);
  write(CURRENT_ACCOUNT_KEY, account.id);
  return account;
}

/** Capture / change the current account's display name (used for attribution). */
export function setAccountName(name: string): Account | null {
  const cur = getAccount();
  if (!cur) return null;
  const accounts = readAccounts();
  const next: Account = { ...cur, name: name.trim() };
  accounts[next.id] = next;
  write(ACCOUNTS_KEY, accounts);
  return next;
}

/** Sign out clears only the current-account pointer; the registry survives. */
export function signOut(): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(CURRENT_ACCOUNT_KEY);
  } catch {
    /* ignore */
  }
}

/* ---- memberships (per-diary roles) -------------------------------------- */

/** Memberships for the signed-in account (owner and/or caregiver, per diary). */
export function getMemberships(): Membership[] {
  const acct = getAccount();
  if (!acct) return [];
  return readMemberships().filter((m) => m.accountId === acct.id);
}

/** The diary this account owns (the owner-app has exactly one), or null. */
function ownedDiaryId(accountId: string): string | null {
  const m = readMemberships().find((x) => x.accountId === accountId && x.role === "owner");
  return m?.diaryId ?? null;
}

/* ---- diary read/write --------------------------------------------------- */

/** The signed-in owner's pet diary, or null before they've created it (→ /create). */
export function getDiary(): Diary | null {
  const acct = getAccount();
  if (!acct) return null;
  const id = ownedDiaryId(acct.id);
  if (!id) return null;
  return readDiaries()[id] ?? null;
}

export function hasDiary(): boolean {
  return getDiary() !== null;
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
export function createDiary(core: DiaryCore): Diary {
  const acct = getAccount() ?? signIn("you@pouncity.app");
  const diary: Diary = {
    id: "d_" + Math.random().toString(36).slice(2, 9),
    ...core,
    quirks: null,
    vet: null,
    neuterStatus: "none",
    registered: false,
    rabies: null,
    currentFood: null,
    coatType: null,
    dietPlan: null,
    groomingGuide: null,
    feedingLog: [],
    handover: { token: null, createdAt: null },
    createdAt: new Date().toISOString(),
  };
  writeDiary(diary);
  const memberships = readMemberships();
  if (!memberships.some((m) => m.accountId === acct.id && m.diaryId === diary.id)) {
    memberships.push({ accountId: acct.id, diaryId: diary.id, role: "owner" });
    write(MEMBERSHIPS_KEY, memberships);
  }
  write(NUDGE_KEY, false); // fresh pet → an active completeness nudge
  return diary;
}

/** Merge a patch into the existing diary (edit); null if none exists yet. */
export function updateDiary(patch: Partial<Diary>): Diary | null {
  const cur = getDiary();
  if (!cur) return null;
  const next = { ...cur, ...patch };
  writeDiary(next);
  return next;
}

/* ---- feeding confirm (diary-id-addressed) ------------------------------- */

/*
 * Feeding mutations are addressed by diary id, not "the signed-in owner's one
 * diary" — a Caregiver confirms a feed on a pet they don't own (via the same
 * FeedingTap, keyed by that pet's id). The owner hub passes its own diary's id,
 * so the owner path is unchanged. Every write still goes through writeDiary.
 */

/** Today's confirm, if one exists (there is at most one per day). */
export function todayEntry(diary: Diary): FeedingEntry | undefined {
  const t = today();
  return diary.feedingLog.find((e) => e.date === t);
}

/** Idempotent confirm on a specific diary — the first confirm of the day wins. */
export function confirmFeedingFor(diaryId: string, by: string): Diary | null {
  const cur = getDiaryById(diaryId);
  if (!cur) return null;
  if (todayEntry(cur)) return cur;
  const next: Diary = {
    ...cur,
    feedingLog: [...cur.feedingLog, { date: today(), by }],
  };
  writeDiary(next);
  return next;
}

/** Reverse today's confirm on a specific diary (same-day mistap). */
export function undoFeedingFor(diaryId: string): Diary | null {
  const cur = getDiaryById(diaryId);
  if (!cur) return null;
  const t = today();
  const next: Diary = {
    ...cur,
    feedingLog: cur.feedingLog.filter((e) => e.date !== t),
  };
  writeDiary(next);
  return next;
}

/** Attach/clear the optional deviation note on today's confirm of a diary. */
export function setTodayNoteFor(diaryId: string, note: string): Diary | null {
  const cur = getDiaryById(diaryId);
  if (!cur) return null;
  const t = today();
  const trimmed = note.trim();
  const next: Diary = {
    ...cur,
    feedingLog: cur.feedingLog.map((e) =>
      e.date === t ? { ...e, note: trimmed || undefined } : e
    ),
  };
  writeDiary(next);
  return next;
}

/** Confirms, most recent first. */
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

export function getFeedReminderFor(diaryId: string): boolean {
  const acct = getAccount();
  if (!acct) return false;
  return readFeedReminders()[reminderKey(acct.id, diaryId)] === true;
}

export function setFeedReminderFor(diaryId: string, on: boolean): void {
  const acct = getAccount();
  if (!acct) return;
  const all = readFeedReminders();
  all[reminderKey(acct.id, diaryId)] = on;
  write(FEED_REMINDERS_KEY, all);
}

/** The reminder condition ticket 09/backend will consume: opted in AND not fed. */
export function feedReminderDue(diary: Diary): boolean {
  return getFeedReminderFor(diary.id) && !isFedToday(diary);
}

/* ---- diet plan (ticket 04) ---------------------------------------------- */

/**
 * The AI generation boundary — a pure function of the diary + current food.
 * Canned/templated now; later the diet-service's insides call the AI Gateway
 * and return the same DietPlan shape. The UI never asserts on the *content*.
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
    meals: young ? "3 smaller meals a day" : "2 meals — morning and evening",
    tips: [
      "Weigh portions with a kitchen scale — cups drift by a lot.",
      "If you add wet food, cut the dry amount to match.",
      "Keep treats under ~10% of the day's food.",
      `Re-check the amount whenever ${diary.name}'s weight changes.`,
    ],
  };
}

export function requestDietPlan(currentFood: string): Diary | null {
  const cur = getDiary();
  if (!cur) return null;
  const plan = generateDietPlan(cur, currentFood);
  const next: Diary = { ...cur, currentFood: plan.currentFood, dietPlan: plan };
  writeDiary(next);
  return next;
}

/** The manual alternative to AI generation — the owner writes the plan themselves. */
export function saveDietPlan(fields: {
  currentFood: string;
  portionPerDay: string;
  meals: string;
  summary?: string;
  tips?: string[];
}): Diary | null {
  const cur = getDiary();
  if (!cur) return null;
  const food = fields.currentFood.trim() || `a complete ${cur.species} food`;
  const plan: DietPlan = {
    createdAt: new Date().toISOString(),
    currentFood: food,
    summary: fields.summary?.trim() || `${cur.name}'s feeding plan, set by you.`,
    portionPerDay: fields.portionPerDay.trim(),
    meals: fields.meals.trim(),
    tips: (fields.tips ?? []).map((t) => t.trim()).filter(Boolean),
  };
  const next: Diary = { ...cur, currentFood: food, dietPlan: plan };
  writeDiary(next);
  return next;
}

/* ---- grooming guide (ticket 06) ----------------------------------------- */

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
        ? `Most cats self-groom, but a ${coat} mats easily — a professional groom about every ${freq} weeks helps.`
        : "Cats mostly self-groom; a professional visit is only needed if the coat gets matted."
      : `A professional groom about every ${freq} weeks keeps the coat and nails in shape.`;
  return {
    createdAt: new Date().toISOString(),
    coatType: coat,
    frequencyWeeks: freq,
    summary: `${diary.name}'s ${coat} does best with a steady rhythm — most of it you can do at home.`,
    routine: [
      `Brush ${brushing} to stop mats and cut shedding.`,
      "Bath every 4–6 weeks, or when actually dirty — over-washing dries the skin.",
      "Trim nails every 3–4 weeks; a click on the floor means they're long.",
      "Check ears and teeth weekly.",
    ],
    professional,
  };
}

export function requestGroomingGuide(coatType: string): Diary | null {
  const cur = getDiary();
  if (!cur) return null;
  const guide = generateGroomingGuide(cur, coatType);
  const next: Diary = { ...cur, coatType: guide.coatType, groomingGuide: guide };
  writeDiary(next);
  return next;
}

/** The manual alternative to AI generation — the owner writes the guide themselves. */
export function saveGroomingGuide(fields: {
  coatType: string;
  frequencyWeeks: number;
  routine?: string[];
  professional?: string;
  summary?: string;
}): Diary | null {
  const cur = getDiary();
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

export function getGroomReminder(): boolean {
  return read<boolean>(GROOM_REMINDER_KEY) === true;
}

export function setGroomReminder(on: boolean): void {
  write(GROOM_REMINDER_KEY, on);
}

/* ---- handover link (tickets 07-09) -------------------------------------- */

/** Issue a fresh standing link token (owner action; the old one dies). */
export function regenerateHandoverLink(): Diary | null {
  const cur = getDiary();
  if (!cur) return null;
  const token = "h_" + Math.random().toString(36).slice(2, 12);
  const next: Diary = {
    ...cur,
    handover: {
      token,
      createdAt: new Date().toISOString(),
    },
  };
  writeDiary(next);
  return next;
}

/** Generate a link only if none exists yet. */
export function ensureHandoverLink(): Diary | null {
  const cur = getDiary();
  if (!cur) return null;
  return cur.handover.token ? cur : regenerateHandoverLink();
}

/** What the sign-in gate is allowed to know about a shared diary: its id and the
 *  pet's name — nothing else. */
export interface HandoverTarget {
  diaryId: string;
  petName: string;
}

/**
 * Resolve a handover token (or referral code — slice 06) to only the pet's id
 * and name, or null if the token is unknown / revoked. This deliberately does
 * NOT return the diary: under ADR-0004 no diary content is readable without an
 * account, so the gate physically cannot leak it. Callers that hold a membership
 * read the diary by id via getDiaryById / the caregiver view (slices 03-04).
 */
export function resolveHandoverGate(token: string): HandoverTarget | null {
  ensureMigrated();
  if (!token) return null;
  const match = Object.values(readDiaries()).find(
    (d) => d.handover.token && d.handover.token === token
  );
  return match ? { diaryId: match.id, petName: match.name } : null;
}

/**
 * The human-readable Referral code for a link — the SAME token, just formatted
 * to read aloud (grouped, upper-case, no `h_` prefix). Not a second credential:
 * regenerate/revoke change the token and the code changes with it.
 */
export function handoverCode(token: string | null): string {
  if (!token) return "";
  const core = token.replace(/^h_/, "").toUpperCase();
  return core.replace(/(.{4})(?=.)/g, "$1-");
}

/** Resolve a typed Referral code (any spacing/case) back to its link token, or null. */
export function resolveCode(code: string): string | null {
  ensureMigrated();
  const norm = code.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (!norm) return null;
  const match = Object.values(readDiaries()).find(
    (d) => d.handover.token && d.handover.token.replace(/^h_/, "").toLowerCase() === norm
  );
  return match?.handover.token ?? null;
}

/** The named Caregivers bound to a diary (for the owner's "who has access"). */
export function diaryCaregivers(diaryId: string): Account[] {
  const accounts = readAccounts();
  return readMemberships()
    .filter((m) => m.diaryId === diaryId && m.role === "caregiver")
    .map((m) => accounts[m.accountId])
    .filter((a): a is Account => !!a);
}

/** The signed-in account's role on a given diary, or null if they have none. */
export function roleOnDiary(diaryId: string): Role | null {
  const acct = getAccount();
  if (!acct) return null;
  const m = readMemberships().find(
    (x) => x.accountId === acct.id && x.diaryId === diaryId
  );
  return m?.role ?? null;
}

/** Read any diary by id (e.g. the caregiver view resolves a pet it has a membership on). */
export function getDiaryById(diaryId: string): Diary | null {
  ensureMigrated();
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
export function joinAsCaregiver(token: string): Membership | null {
  const acct = getAccount();
  if (!acct) return null;
  const target = resolveHandoverGate(token);
  if (!target) return null;
  const existing = readMemberships().find(
    (m) => m.accountId === acct.id && m.diaryId === target.diaryId
  );
  if (existing) return existing.role === "caregiver" ? existing : null;
  const membership: Membership = {
    accountId: acct.id,
    diaryId: target.diaryId,
    role: "caregiver",
  };
  const all = readMemberships();
  all.push(membership);
  write(MEMBERSHIPS_KEY, all);
  return membership;
}

/**
 * Whole-link revoke — ends access for everyone at once. The token dies AND every
 * Caregiver bound to THIS diary is unbound (their /care view already stops on the
 * dead token; this also clears the rows so the caregiver lists in slices 05-06
 * stay honest). The owner membership and every OTHER diary's memberships are
 * untouched.
 */
export function revokeHandoverLink(): Diary | null {
  const cur = getDiary();
  if (!cur) return null;
  const next: Diary = {
    ...cur,
    handover: { token: null, createdAt: null },
  };
  writeDiary(next);
  const remaining = readMemberships().filter(
    (m) => !(m.diaryId === cur.id && m.role === "caregiver")
  );
  write(MEMBERSHIPS_KEY, remaining);
  return next;
}

/* ---- caregiving ("Helping with") + demo seeding (slice 05) -------------- */

/** Diaries the signed-in account helps with (caregiver role) — real + demo. */
export function caregivingDiaries(): Diary[] {
  const acct = getAccount();
  if (!acct) return [];
  const diaries = readDiaries();
  return readMemberships()
    .filter((m) => m.accountId === acct.id && m.role === "caregiver")
    .map((m) => diaries[m.diaryId])
    .filter((d): d is Diary => !!d);
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
    },
    groomingGuide: {
      createdAt: new Date().toISOString(),
      coatType: groom.coatType,
      frequencyWeeks: groom.frequencyWeeks,
      summary: `${name}'s ${groom.coatType} does best with a steady rhythm — most of it you can do at home.`,
      routine: [
        `Brush ${groom.brushing} to stop mats and cut shedding.`,
        "Bath every 4–6 weeks, or when actually dirty — over-washing dries the skin.",
        "Trim nails every 3–4 weeks; a click on the floor means they're long.",
        "Check ears and teeth weekly.",
      ],
      professional:
        species === "cat"
          ? `Most cats self-groom, but a ${groom.coatType} mats easily — a professional groom about every ${groom.frequencyWeeks} weeks helps.`
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
export function ensureDemoCaregiving(): void {
  const acct = getAccount();
  if (!acct) return;
  const mems = readMemberships();
  if (mems.some((m) => m.accountId === acct.id && m.role === "caregiver")) return;

  const demos = [
    buildDemoDiary(
      "demo_mochi",
      "Mochi",
      "cat",
      "Ragdoll",
      "Naps on the windowsill every afternoon — leave the blind up.",
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

export function isNudgeDismissed(): boolean {
  return read<boolean>(NUDGE_KEY) === true;
}

export function setNudgeDismissed(dismissed: boolean): void {
  write(NUDGE_KEY, dismissed);
}

/* ---- find care: your circle + a verified-sitters directory -------------- */

export type ProviderKind = "circle" | "verified";

/** One entry in Find care — either someone in the signed-in account's own
 *  circle, or a listing from the verified-sitters directory. */
export interface CareProvider {
  id: string;
  name: string;
  kind: ProviderKind;
  relation: string;
  meta: string;
  blurb: string;
  /** 0 = no reviews yet. */
  rating: number;
  reviewCount: number;
  /** null = no cost (a circle contact isn't paid through the app). */
  price: string | null;
  verified: boolean;
}

export interface CareReview {
  who: string;
  stars: number;
  when: string;
  text: string;
}

export interface CareRequest {
  id: string;
  providerId: string;
  providerName: string;
  when: string;
  notes: string;
  createdAt: string;
}

/**
 * There is no real sitter onboarding yet, so the verified directory is a
 * small, static set of example listings — never presented as real people or
 * real reviews (same honesty rule as the DEMO-marked caregiving pets in
 * slice 05). Screens must label these "Example listing".
 */
const VERIFIED_SITTERS: CareProvider[] = [
  {
    id: "neha",
    name: "Neha Verma",
    kind: "verified",
    relation: "Verified pet sitter",
    meta: "1.2 km away · responds in ~20 min",
    blurb: "5 years boarding dogs from her home. Fenced yard, no other pets during your stay.",
    rating: 4.9,
    reviewCount: 32,
    price: "₹650/night",
    verified: true,
  },
  {
    id: "pawsitive",
    name: "The Pawsitive House",
    kind: "verified",
    relation: "Boarding facility",
    meta: "2.8 km away · HSR Layout",
    blurb: "Licensed facility with CCTV in common areas and a resident vet on call.",
    rating: 4.6,
    reviewCount: 18,
    price: "₹900/night",
    verified: true,
  },
  {
    id: "farhan",
    name: "Farhan S.",
    kind: "verified",
    relation: "Verified sitter · walks & overnight",
    meta: "0.9 km away · responds in ~1 hr",
    blurb: "Newer on Pouncity but background-checked and well reviewed elsewhere.",
    rating: 5.0,
    reviewCount: 6,
    price: "₹500/night",
    verified: true,
  },
];

const CARE_REVIEWS: Record<string, CareReview[]> = {
  neha: [
    { who: "Aditi R.", stars: 5, when: "2 weeks ago", text: "Sent photos every evening without me asking. Would book again." },
    { who: "Sam K.", stars: 5, when: "1 month ago", text: "Our cat is skittish with strangers — Neha was patient and gave a full update after." },
    { who: "Priyanka M.", stars: 4, when: "2 months ago", text: "Great care, pickup timing was a little off." },
  ],
  pawsitive: [
    { who: "Ronit D.", stars: 5, when: "3 weeks ago", text: "The CCTV access genuinely helped — checked in on my dog from the airport." },
    { who: "Meher V.", stars: 4, when: "1 month ago", text: "Clean, professional, a bit pricier than a home sitter." },
  ],
  farhan: [
    { who: "Dev A.", stars: 5, when: "1 week ago", text: "Took my Husky on real runs, not just short walks. Very reliable." },
  ],
};

function readCircleMap(): Record<string, CareProvider[]> {
  return read<Record<string, CareProvider[]>>(CIRCLE_KEY) ?? {};
}

/** The signed-in account's trusted circle. Empty until they add someone —
 *  unlike the verified directory this is real data, never seeded. */
export function getCircle(): CareProvider[] {
  const acct = getAccount();
  if (!acct) return [];
  return readCircleMap()[acct.id] ?? [];
}

export function addCircleContact(input: {
  name: string;
  relation: string;
  phone?: string;
}): CareProvider | null {
  const acct = getAccount();
  if (!acct) return null;
  const contact: CareProvider = {
    id: "c_" + Math.random().toString(36).slice(2, 9),
    name: input.name,
    kind: "circle",
    relation: input.relation,
    meta: input.phone || "In your circle",
    blurb: "",
    rating: 0,
    reviewCount: 0,
    price: null,
    verified: false,
  };
  const all = readCircleMap();
  all[acct.id] = [contact, ...(all[acct.id] ?? [])];
  write(CIRCLE_KEY, all);
  return contact;
}

/** Everything Find care can show: the signed-in account's circle first, then
 *  the verified directory. */
export function findCareList(): CareProvider[] {
  return [...getCircle(), ...VERIFIED_SITTERS];
}

/** One provider by id, from either the circle or the verified directory. */
export function getCareProvider(id: string): CareProvider | null {
  return findCareList().find((p) => p.id === id) ?? null;
}

export function careReviews(providerId: string): CareReview[] {
  return CARE_REVIEWS[providerId] ?? [];
}

function readRequestsMap(): Record<string, CareRequest[]> {
  return read<Record<string, CareRequest[]>>(CARE_REQUESTS_KEY) ?? {};
}

/** The signed-in account's own sent requests. */
export function careRequests(): CareRequest[] {
  const acct = getAccount();
  if (!acct) return [];
  return readRequestsMap()[acct.id] ?? [];
}

export function hasRequestedCare(providerId: string): boolean {
  return careRequests().some((r) => r.providerId === providerId);
}

/**
 * Record that the signed-in account asked a provider for care. Idempotent —
 * re-asking the same provider returns the existing request rather than
 * duplicating it (mirrors joinAsCaregiver's no-duplicate rule). There is no
 * real other side to accept/decline yet, so this never fabricates a
 * confirmed state — it only ever records that the ask was sent.
 */
export function requestCare(
  provider: CareProvider,
  when: string,
  notes: string
): CareRequest | null {
  const acct = getAccount();
  if (!acct) return null;
  const existing = careRequests().find((r) => r.providerId === provider.id);
  if (existing) return existing;
  const req: CareRequest = {
    id: "req_" + Math.random().toString(36).slice(2, 9),
    providerId: provider.id,
    providerName: provider.name,
    when,
    notes,
    createdAt: new Date().toISOString(),
  };
  const all = readRequestsMap();
  all[acct.id] = [req, ...(all[acct.id] ?? [])];
  write(CARE_REQUESTS_KEY, all);
  return req;
}

/* ---- sitter profile: a draft listing, honestly not yet publishable ------ */

export interface SitterListing {
  bio: string;
  priceLabel: string;
  petTypes: string[];
  availability: ("open" | "booked")[]; // 7 entries, Mon–Sun
  updatedAt: string;
}

const SITTER_KEY = "pouncity_sitter_listing_v1"; // { [accountId]: SitterListing }

function readSitterMap(): Record<string, SitterListing> {
  return read<Record<string, SitterListing>>(SITTER_KEY) ?? {};
}

/** The signed-in account's own draft sitter listing, or null if never saved. */
export function getSitterListing(): SitterListing | null {
  const acct = getAccount();
  if (!acct) return null;
  return readSitterMap()[acct.id] ?? null;
}

/**
 * Save a draft listing. There is no real ID/background-check verification
 * behind this yet, so it is never "published" into the Find care directory —
 * the screen that calls this must keep saying so, not imply the listing is
 * live.
 */
export function saveSitterListing(fields: {
  bio: string;
  priceLabel: string;
  petTypes: string[];
  availability: ("open" | "booked")[];
}): SitterListing | null {
  const acct = getAccount();
  if (!acct) return null;
  const listing: SitterListing = { ...fields, updatedAt: new Date().toISOString() };
  const all = readSitterMap();
  all[acct.id] = listing;
  write(SITTER_KEY, all);
  return listing;
}

export function circleStatus(): HubCardStatus {
  const n = getCircle().length;
  return n === 0
    ? { label: "Empty", tone: "empty" }
    : { label: `${n} ${n === 1 ? "person" : "people"}`, tone: "ready" };
}

export function findCareStatus(): HubCardStatus {
  return { label: `${VERIFIED_SITTERS.length} nearby`, tone: "ready" };
}

/* ---- derived view helpers (kept here so screens stay declarative) -------- */

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
