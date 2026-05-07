// Supabase Edge Function: send-push
// Triggered by a Postgres trigger on the `todos` table whenever a task is
// added, updated (marked done), so it pushes a Web Push notification to all
// subscribers except the actor.
//
// Required env vars (Project Settings → Edge Functions → send-push → Secrets):
//   VAPID_PUBLIC_KEY    — base64url public key
//   VAPID_PRIVATE_KEY   — base64url private key
//   WEBHOOK_SECRET      — random secret shared with the Postgres trigger
//   SUPABASE_URL        — auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-provided by Supabase

import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;
const APP_URL = "https://aspengineering.github.io/beulah-dashboard/";

webpush.setVapidDetails("mailto:adam.vass@aspconsulting.dev", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  if (req.headers.get("X-Webhook-Secret") !== WEBHOOK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  let payload: any;
  try { payload = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: actor } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", payload.actor_id)
    .single();
  const actorName = actor?.display_name || actor?.email?.split("@")[0] || "Someone";

  let leadName = "";
  if (payload.lead_id) {
    const { data: lead } = await supabase
      .from("leads")
      .select("name")
      .eq("id", payload.lead_id)
      .single();
    leadName = lead?.name || "";
  }

  let title = "Beulah";
  let body = "";
  if (payload.event === "task_added") {
    title = `${actorName} added a task`;
    body = leadName ? `${leadName}: ${payload.body}` : payload.body;
  } else if (payload.event === "master_added") {
    title = `${actorName} added a master task`;
    body = payload.body;
  } else if (payload.event === "task_done") {
    title = `${actorName} ✓ ${payload.body}`;
    body = leadName ? `On ${leadName}` : "Master task completed";
  } else if (payload.event === "lead_added") {
    title = `${actorName} added a lead`;
    body = payload.body;
  } else if (payload.event === "lead_signed") {
    title = `Deal closed: ${payload.body}`;
    body = `${actorName} moved this lead to Signed`;
  } else {
    return new Response("ignored");
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .neq("user_id", payload.actor_id);

  const message = JSON.stringify({ title, body, url: APP_URL, tag: payload.todo_id });

  await Promise.all((subs || []).map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message
      );
    } catch (e: any) {
      console.error("push failed", sub.endpoint, e?.statusCode, e?.body);
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }));

  return new Response(JSON.stringify({ sent: subs?.length || 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
