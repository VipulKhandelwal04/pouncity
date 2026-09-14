"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PetAvatar } from "./PetAvatar";
import { fileToDataUrl, readFileAsDataUrl } from "@/lib/image";
import {
  createDiary,
  updateDiary,
  type Diary,
  type Species,
  type NeuterStatus,
} from "@/lib/diary-service";

type Errors = Partial<Record<"name" | "breed" | "age" | "weight", string>>;

export function DiaryForm({
  initial,
  mode,
}: {
  initial?: Diary;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [species, setSpecies] = useState<Species>(initial?.species ?? "dog");
  const [breed, setBreed] = useState(initial?.breed ?? "");
  const [age, setAge] = useState(initial?.ageLabel ?? "");
  const [weight, setWeight] = useState(
    initial?.weightKg != null ? String(initial.weightKg) : ""
  );
  const [photo, setPhoto] = useState<string | null>(initial?.photoUrl ?? null);
  const [busyPhoto, setBusyPhoto] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Optional fields (quirks + vet) appear only when editing; onboarding stays minimal.
  const showOptional = mode === "edit";
  const [quirks, setQuirks] = useState(initial?.quirks ?? "");
  const [vetName, setVetName] = useState(initial?.vet?.name ?? "");
  const [vetPhone, setVetPhone] = useState(initial?.vet?.phone ?? "");
  const [vetClinic, setVetClinic] = useState(initial?.vet?.clinic ?? "");

  // Health & records. `rabies` (the flag) is true when a record exists; the
  // certificate (photo or PDF) + expiry hang off it and are only asked for once
  // it's on.
  const [neuterStatus, setNeuterStatus] = useState<NeuterStatus>(
    initial?.neuterStatus ?? "none"
  );
  const [registered, setRegistered] = useState(initial?.registered ?? false);
  const [rabies, setRabies] = useState(initial?.rabies != null);
  const [rabiesCert, setRabiesCert] = useState<string | null>(
    initial?.rabies?.certificateUrl ?? null
  );
  const [rabiesExpiry, setRabiesExpiry] = useState(initial?.rabies?.expiry ?? "");
  const [certErr, setCertErr] = useState<string | null>(null);
  const [busyCert, setBusyCert] = useState(false);
  const certRef = useRef<HTMLInputElement>(null);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!f) return;
    setBusyPhoto(true);
    try {
      setPhoto(await fileToDataUrl(f));
    } finally {
      setBusyPhoto(false);
    }
  }

  async function onCert(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setCertErr(null);
    if (f.type === "application/pdf") {
      // A PDF is stored as-is (data URL in localStorage now, blob storage later),
      // so cap it — a large file would silently blow the storage quota on save.
      if (f.size > 2 * 1024 * 1024) {
        setCertErr("That PDF is over 2 MB — upload a smaller file or a photo instead.");
        return;
      }
      setBusyCert(true);
      try {
        setRabiesCert(await readFileAsDataUrl(f));
      } finally {
        setBusyCert(false);
      }
    } else if (f.type.startsWith("image/")) {
      setBusyCert(true);
      try {
        // A bit larger than the pet photo so the certificate text stays legible.
        setRabiesCert(await fileToDataUrl(f, 1400));
      } finally {
        setBusyCert(false);
      }
    } else {
      setCertErr("Upload a photo (JPG/PNG) or a PDF.");
    }
  }

  function clear(field: keyof Errors) {
    setErrors((er) => (er[field] ? { ...er, [field]: undefined } : er));
  }

  function validate(): boolean {
    const er: Errors = {};
    if (!name.trim()) er.name = "What's your pet's name?";
    if (!breed.trim()) er.breed = "Add a breed — or just “mixed”.";
    if (!age.trim()) er.age = "Roughly how old are they?";
    const w = parseFloat(weight);
    if (!weight.trim()) er.weight = "Add a weight.";
    else if (isNaN(w) || w <= 0) er.weight = "Weight should be a number in kg.";
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const core = {
      name: name.trim(),
      species,
      breed: breed.trim(),
      ageLabel: age.trim(),
      weightKg: parseFloat(weight),
      photoUrl: photo,
    };
    if (mode === "create") {
      createDiary(core);
    } else {
      const vetFilled = vetName.trim() || vetPhone.trim() || vetClinic.trim();
      updateDiary({
        ...core,
        quirks: quirks.trim() ? quirks.trim() : null,
        vet: vetFilled
          ? { name: vetName.trim(), phone: vetPhone.trim(), clinic: vetClinic.trim() }
          : null,
        neuterStatus,
        registered,
        rabies: rabies
          ? { certificateUrl: rabiesCert, expiry: rabiesExpiry.trim() ? rabiesExpiry : null }
          : null,
      });
    }
    router.replace("/diary");
  }

  return (
    <form onSubmit={submit} noValidate>
      {/* photo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 22,
        }}
      >
        <PetAvatar species={species} photoUrl={photo} name={name || "your pet"} size={84} />
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPhoto}
            hidden
          />
          <button
            type="button"
            className="pill pill--ghost pill--sm"
            onClick={() => fileRef.current?.click()}
            disabled={busyPhoto}
          >
            {busyPhoto ? "Adding…" : photo ? "Change photo" : "Add a photo"}
          </button>
          {photo && (
            <button
              type="button"
              className="mono"
              onClick={() => setPhoto(null)}
              style={{ display: "block", marginTop: 8, color: "var(--coral-text)" }}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <Field label="Name" error={errors.name}>
        <input
          className="input"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clear("name");
          }}
          placeholder="Biscuit"
          autoComplete="off"
        />
      </Field>

      <div className="form-field">
        <label>Species</label>
        <div className="seg" role="group" aria-label="Species">
          {(["dog", "cat"] as Species[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={species === s}
              onClick={() => setSpecies(s)}
            >
              {s === "dog" ? "Dog" : "Cat"}
            </button>
          ))}
        </div>
      </div>

      <Field label="Breed" error={errors.breed}>
        <input
          className="input"
          value={breed}
          onChange={(e) => {
            setBreed(e.target.value);
            clear("breed");
          }}
          placeholder="Golden Retriever"
          autoComplete="off"
        />
      </Field>

      <Field label="Age" error={errors.age}>
        <input
          className="input"
          value={age}
          onChange={(e) => {
            setAge(e.target.value);
            clear("age");
          }}
          placeholder="e.g. 3 years"
          autoComplete="off"
        />
      </Field>

      <Field label="Weight (kg)" error={errors.weight}>
        <input
          className="input"
          value={weight}
          onChange={(e) => {
            setWeight(e.target.value);
            clear("weight");
          }}
          placeholder="e.g. 28"
          inputMode="decimal"
          autoComplete="off"
        />
      </Field>

      {showOptional && (
        <>
          <div className="form-section">
            <h3>Quirks</h3>
            <p className="form-section-note">
              Anything a sitter should know — habits, fears, the good spots.
            </p>
            <textarea
              className="input"
              value={quirks}
              onChange={(e) => setQuirks(e.target.value)}
              placeholder="Hates the vacuum. Will do anything for a tennis ball."
              rows={3}
            />
          </div>

          <div className="form-section">
            <h3>Vet contact</h3>
            <p className="form-section-note">So a sitter has it in an emergency.</p>
            <Field label="Vet name">
              <input
                className="input"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
                placeholder="Dr. Rivera"
                autoComplete="off"
              />
            </Field>
            <Field label="Phone">
              <input
                className="input"
                type="tel"
                value={vetPhone}
                onChange={(e) => setVetPhone(e.target.value)}
                placeholder="(555) 012-3456"
                autoComplete="off"
              />
            </Field>
            <Field label="Clinic">
              <input
                className="input"
                value={vetClinic}
                onChange={(e) => setVetClinic(e.target.value)}
                placeholder="Elm Street Animal Hospital"
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="form-section">
            <h3>Health &amp; records</h3>
            <p className="form-section-note">
              Handy for a sitter, a boarding stay, or a vet visit.
            </p>

            <PillSeg
              label="Neutered / spayed"
              value={neuterStatus}
              options={[
                { value: "neutered", label: "Neutered" },
                { value: "spayed", label: "Spayed" },
                { value: "none", label: "None" },
              ]}
              onChange={(v) => setNeuterStatus(v as NeuterStatus)}
            />
            <PillSeg
              label="Registered"
              value={registered ? "yes" : "no"}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              onChange={(v) => setRegistered(v === "yes")}
            />
            <PillSeg
              label="Rabies vaccinated"
              value={rabies ? "yes" : "no"}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              onChange={(v) => setRabies(v === "yes")}
            />

            {rabies && (
              <div
                style={{
                  marginTop: 4,
                  paddingLeft: 14,
                  borderLeft: "2.5px solid var(--sun)",
                  display: "grid",
                  gap: 16,
                }}
              >
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>Certificate</label>
                  <input
                    ref={certRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={onCert}
                    hidden
                  />
                  {rabiesCert ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      {rabiesCert.startsWith("data:application/pdf") ? (
                        <span
                          className="mono"
                          aria-hidden="true"
                          style={{
                            display: "grid",
                            placeItems: "center",
                            width: 56,
                            height: 56,
                            flex: "0 0 auto",
                            borderRadius: 12,
                            border: "var(--border)",
                            background: "var(--sun)",
                            fontSize: "0.6rem",
                          }}
                        >
                          PDF
                        </span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rabiesCert}
                          alt="Rabies certificate"
                          style={{
                            width: 56,
                            height: 56,
                            objectFit: "cover",
                            borderRadius: 12,
                            border: "var(--border)",
                            flex: "0 0 auto",
                          }}
                        />
                      )}
                      <button
                        type="button"
                        className="pill pill--ghost pill--sm"
                        onClick={() => certRef.current?.click()}
                        disabled={busyCert}
                      >
                        {busyCert ? "Adding…" : "Replace"}
                      </button>
                      <button
                        type="button"
                        className="mono"
                        onClick={() => {
                          setRabiesCert(null);
                          setCertErr(null);
                        }}
                        style={{ color: "var(--coral-text)" }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="pill pill--ghost pill--sm"
                      onClick={() => certRef.current?.click()}
                      disabled={busyCert}
                      style={{ justifySelf: "start" }}
                    >
                      {busyCert ? "Adding…" : "Upload certificate — photo or PDF"}
                    </button>
                  )}
                  {certErr && (
                    <p className="field-msg" role="alert">
                      {certErr}
                    </p>
                  )}
                </div>

                <Field label="Expiry date">
                  <input
                    className="input"
                    type="date"
                    value={rabiesExpiry}
                    onChange={(e) => setRabiesExpiry(e.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
        <button type="submit" className="pill" style={{ flex: 1 }}>
          {mode === "create" ? "Create diary" : "Save changes"}
        </button>
        {mode === "edit" && (
          <Link href="/diary" className="pill pill--ghost">
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}

function PillSeg({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <div className="pillseg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
      {error && (
        <p className="field-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
