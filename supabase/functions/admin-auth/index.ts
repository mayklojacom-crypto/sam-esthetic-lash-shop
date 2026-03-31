import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, action } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "setup") {
      // Create first admin user
      const { data: existing } = await supabase.from("admin_users").select("id").limit(1);
      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ error: "Admin já existe" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const password_hash = await hashPassword(password);
      const { error } = await supabase.from("admin_users").insert({ email, password_hash });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Login
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const password_hash = await hashPassword(password);
    const { data: users, error } = await supabase
      .from("admin_users")
      .select("id, email")
      .eq("email", email)
      .eq("password_hash", password_hash)
      .limit(1);

    if (error) throw error;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ error: "Credenciais inválidas" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate a simple token (SHA-256 of id + timestamp + secret)
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const tokenData = `${users[0].id}:${Date.now()}:${secret}`;
    const tokenHash = await hashPassword(tokenData);
    const token = btoa(JSON.stringify({ id: users[0].id, email: users[0].email, ts: Date.now(), h: tokenHash.slice(0, 16) }));

    return new Response(JSON.stringify({ token, email: users[0].email }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
