"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DetailShell } from "@/components/DetailShell";
import { DiaryForm } from "@/components/DiaryForm";
import { getDiary, type Diary } from "@/lib/diary-service";

export default function EditPage() {
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const d = getDiary();
    if (!d) {
      router.replace("/diary/create");
      return;
    }
    setDiary(d);
    setReady(true);
  }, [router]);

  if (!ready || !diary) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  return (
    <DetailShell title={`Edit ${diary.name}'s diary`}>
      <DiaryForm mode="edit" initial={diary} />
    </DetailShell>
  );
}
