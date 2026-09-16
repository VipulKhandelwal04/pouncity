"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DetailShell } from "@/components/DetailShell";
import {
  getAccount,
  getDiary,
  updateProfile,
  removeDiary,
  signOut,
  type Account,
  type Diary,
} from "@/lib/diary-service";

export default function ProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [diary, setDiary] = useState<Diary | null>(null);
  const [ready, setReady] = useState(false);

  // details form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  // remove-pet flow
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeErr, setRemoveErr] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const [acct, d] = await Promise.all([getAccount(), getDiary()]);
      if (!acct) {
        router.replace("/sign-in?next=" + encodeURIComponent("/diary/profile"));
        return;
      }
      setAccount(acct);
      setDiary(d);
      setName(acct.name ?? "");
      setPhone(acct.phone ?? "");
      setEmergencyPhone(acct.emergencyPhone ?? "");
      setReady(true);
    }
    run();
  }, [router]);

  async function saveDetails() {
    if (!name.trim()) {
      setSaveErr("Your name can't be empty.");
      return;
    }
    setSaving(true);
    setSaveErr(null);
    setSaveMsg(null);
    const updated = await updateProfile({ name, phone, emergencyPhone });
    setSaving(false);
    if (!updated) {
      setSaveErr("Couldn't save. Check your connection and try again.");
      return;
    }
    setAccount(updated);
    setSaveMsg("Saved.");
  }

  async function handleSignOut() {
    await signOut();
    window.location.href = "/sign-in";
  }

  async function handleRemove() {
    setRemoving(true);
    setRemoveErr(null);
    try {
      const ok = await removeDiary();
      if (!ok) {
        setRemoveErr("Couldn't remove the diary. Try again in a moment.");
        setRemoving(false);
        return;
      }
      router.replace("/diary/create");
    } catch {
      setRemoveErr("Couldn't remove the diary. Try again in a moment.");
      setRemoving(false);
    }
  }

  if (!ready || !account) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  return (
    <DetailShell title="Profile">
      <div style={{ display: "grid", gap: 26 }}>
        {/* your details */}
        <section style={{ display: "grid", gap: 16 }}>
          <span className="mono" style={{ color: "var(--ink-72)" }}>
            Your details
          </span>
          <Field label="Name">
            <input
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaveErr(null);
                setSaveMsg(null);
              }}
              autoComplete="name"
            />
          </Field>
          <Field label="Email">
            <input className="input" value={account.email} disabled aria-readonly="true" />
            <p style={{ marginTop: 6, fontSize: "0.8rem", color: "var(--ink-72)" }}>
              Comes from your Google account, so it can't be changed here.
            </p>
          </Field>
          <Field label="Phone (optional)">
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSaveMsg(null);
              }}
              placeholder="e.g. +91 98765 43210"
              autoComplete="tel"
            />
          </Field>
          <Field label="Emergency contact number (optional)">
            <input
              className="input"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => {
                setEmergencyPhone(e.target.value);
                setSaveMsg(null);
              }}
              placeholder="Someone to call if you're unreachable"
              autoComplete="off"
            />
          </Field>
          {saveErr && (
            <p className="field-msg" role="alert">
              {saveErr}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button className="pill" onClick={saveDetails} disabled={saving}>
              {saving ? "Saving…" : "Save details"}
            </button>
            {saveMsg && (
              <span className="mono" role="status" style={{ color: "var(--ink-72)" }}>
                {saveMsg}
              </span>
            )}
          </div>
        </section>

        {/* sign out */}
        <section style={{ display: "grid", gap: 12 }}>
          <span className="mono" style={{ color: "var(--ink-72)" }}>
            Session
          </span>
          <button
            className="pill pill--ghost"
            onClick={handleSignOut}
            style={{ justifySelf: "start" }}
          >
            Sign out
          </button>
        </section>

        {/* remove pet */}
        {diary && (
          <section style={{ display: "grid", gap: 12 }}>
            <span className="mono" style={{ color: "var(--coral-text)" }}>
              Remove {diary.name}&rsquo;s diary
            </span>
            {!confirming ? (
              <div className="card" style={{ display: "grid", gap: 12 }}>
                <p style={{ lineHeight: 1.55, color: "var(--ink-72)" }}>
                  Removing the diary permanently deletes everything about {diary.name}: the
                  profile and photo, feeding history, diet plan, grooming guide, sharing links
                  and any caregiver access. There is no undo.
                </p>
                <button
                  className="pill pill--ghost"
                  onClick={() => setConfirming(true)}
                  style={{ justifySelf: "start", color: "var(--coral-text)" }}
                >
                  Remove {diary.name}&rsquo;s diary
                </button>
              </div>
            ) : (
              <div className="card" style={{ borderStyle: "dashed", display: "grid", gap: 12 }}>
                <p style={{ lineHeight: 1.55, fontWeight: 600 }}>
                  Are you sure? This wipes {diary.name}&rsquo;s diary completely and can&rsquo;t
                  be undone. Anyone helping with {diary.name} loses access immediately.
                </p>
                {removeErr && (
                  <p className="field-msg" role="alert">
                    {removeErr}
                  </p>
                )}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="pill" onClick={handleRemove} disabled={removing}>
                    {removing ? "Removing…" : "Yes, remove everything"}
                  </button>
                  <button
                    className="pill pill--ghost"
                    onClick={() => {
                      setConfirming(false);
                      setRemoveErr(null);
                    }}
                    disabled={removing}
                  >
                    Keep the diary
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </DetailShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-field" style={{ margin: 0 }}>
      <label>{label}</label>
      {children}
    </div>
  );
}
