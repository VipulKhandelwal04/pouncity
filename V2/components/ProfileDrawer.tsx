"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDiary,
  updateProfile,
  removeDiary,
  signOut,
  type Account,
  type Diary,
} from "@/lib/diary-service";

/**
 * The profile drawer — slides in from the right when the header's profile chip
 * is tapped. Holds the account details (name, email, phone, emergency
 * contact), Sign out, and the remove-pet flow with its two-step warning.
 * Closes on the backdrop, the ✕, or Escape.
 */
export function ProfileDrawer({
  account,
  open,
  onClose,
  onAccountChange,
}: {
  account: Account;
  open: boolean;
  onClose: () => void;
  onAccountChange: (a: Account) => void;
}) {
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);

  const [name, setName] = useState(account.name ?? "");
  const [phone, setPhone] = useState(account.phone ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(account.emergencyPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeErr, setRemoveErr] = useState<string | null>(null);

  // Re-seed the form and load the diary each time the drawer opens, so it
  // always shows current values (the nav cache makes getDiary instant).
  useEffect(() => {
    if (!open) return;
    setName(account.name ?? "");
    setPhone(account.phone ?? "");
    setEmergencyPhone(account.emergencyPhone ?? "");
    setSaveMsg(null);
    setSaveErr(null);
    setConfirming(false);
    setRemoveErr(null);
    getDiary().then(setDiary);
  }, [open, account]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
    onAccountChange(updated);
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
      onClose();
      router.replace("/diary/create");
    } catch {
      setRemoveErr("Couldn't remove the diary. Try again in a moment.");
      setRemoving(false);
    }
  }

  return (
    <div
      aria-hidden={!open}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(31,26,22,0.35)",
          opacity: open ? 1 : 0,
          transition: "opacity .25s ease",
        }}
      />
      {/* panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your profile"
        className="profile-drawer"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 92vw)",
          background: "var(--cream)",
          borderLeft: "var(--border)",
          transform: open ? "translateX(0)" : "translateX(102%)",
          transition: "transform .28s ease",
          overflowY: "auto",
          padding: "22px var(--gutter, 20px) 34px",
          display: "grid",
          gap: 26,
          alignContent: "start",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="pill pill--ghost pill--sm"
          >
            ✕
          </button>
        </div>

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
      </aside>
    </div>
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
