/**
 * A tap-to-call link. Owns the one rule about phone numbers in this app:
 * display them as entered, dial them stripped to digits and "+".
 */
export function TelLink({ phone }: { phone: string }) {
  return (
    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} style={{ color: "var(--coral-text)" }}>
      {phone}
    </a>
  );
}
