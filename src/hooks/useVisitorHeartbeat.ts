import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "sam_session_id";
const DAY_KEY = "sam_session_day";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function ping() {
  if (document.hidden) return;
  const session_id = getSessionId();
  const today = new Date().toISOString().split("T")[0];
  const lastDay = localStorage.getItem(DAY_KEY);
  const firstOfDay = lastDay !== today;
  if (firstOfDay) localStorage.setItem(DAY_KEY, today);
  try {
    await supabase.functions.invoke("track-visit", {
      body: { session_id, firstOfDay },
    });
  } catch {
    // ignore
  }
}

export function useVisitorHeartbeat() {
  useEffect(() => {
    ping();
    const iv = setInterval(ping, 30_000);
    const onVis = () => { if (!document.hidden) ping(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
}
