export default {
  async fetch(req, env) {
    const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

    const readResponseText = async (response) => {
      try {
        return await response.text();
      } catch {
        return "";
      }
    };

    const buildCorsHeaders = (origin) => {
      const allowedOrigins = (env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : null;

      return {
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, x-whispertype-timings",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        Vary: "Origin",
        ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin } : {}),
      };
    };

    const json = (body, status, origin) =>
      new Response(JSON.stringify(body), {
        status,
        headers: {
          ...buildCorsHeaders(origin),
          "Content-Type": "application/json",
        },
      });

    const origin = req.headers.get("Origin");

    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: buildCorsHeaders(origin) });
    }

    if (req.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405, origin);
    }

    try {
      const supabaseUrl = env.SUPABASE_URL;
      const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("server_misconfigured: missing_supabase_env");
      }

      const authHeader = req.headers.get("Authorization") || "";
      const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

      if (!accessToken) {
        return json({ error: "auth_required" }, 401, origin);
      }

      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        return json({ error: "auth_required" }, 401, origin);
      }

      const user = await userResponse.json();
      const userId = typeof user?.id === "string" ? user.id : null;

      if (!userId) {
        return json({ error: "auth_required" }, 401, origin);
      }

      const contextResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_transcription_context`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      });

      if (!contextResponse.ok) {
        throw new Error(
          `context_lookup_failed: status=${contextResponse.status} body=${await readResponseText(contextResponse)}`
        );
      }

      const contextRows = await contextResponse.json();
      const context = Array.isArray(contextRows) ? contextRows[0] : contextRows;

      if (!context || context.user_id !== userId) {
        throw new Error("context_lookup_failed: user_mismatch");
      }

      if (!context.is_unlimited && (context.available_credits ?? 0) <= 0) {
        return json({ error: "insufficient_credits" }, 402, origin);
      }

      const contentType = req.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("multipart/form-data")) {
        throw new Error(`invalid_content_type: ${contentType || "missing"}`);
      }

      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        throw new Error("invalid_audio: missing_file");
      }

      if (file.size > MAX_AUDIO_BYTES) {
        return json({ error: "invalid_audio" }, 413, origin);
      }

      const gatewayAccountId = env.CF_AI_GATEWAY_ACCOUNT_ID;
      const gatewayId = env.CF_AI_GATEWAY_ID;
      const gatewayToken = env.CF_AIG_TOKEN || "";

      if (!gatewayAccountId || !gatewayId) {
        throw new Error("server_misconfigured: missing_cloudflare_gateway_env");
      }

      const groqFormData = new FormData();
      groqFormData.append("file", file, file.name || "audio.webm");
      groqFormData.append("model", (formData.get("model") || "whisper-large-v3-turbo").toString());
      groqFormData.append("response_format", "json");

      const language = formData.get("language");
      if (typeof language === "string" && language && language !== "auto") {
        groqFormData.append("language", language);
      }

      const prompt = formData.get("prompt");
      if (typeof prompt === "string" && prompt.trim()) {
        groqFormData.append("prompt", prompt.trim());
      }

      const gatewayHeaders = {};
      if (gatewayToken) {
        gatewayHeaders["cf-aig-authorization"] = `Bearer ${gatewayToken}`;
      }

      const gatewayBaseUrl = `https://gateway.ai.cloudflare.com/v1/${gatewayAccountId}/${gatewayId}/groq`;
      const transcriptionResponse = await fetch(`${gatewayBaseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: gatewayHeaders,
        body: groqFormData,
      });

      if (!transcriptionResponse.ok) {
        const body = await readResponseText(transcriptionResponse);
        throw new Error(`groq_request_failed: ${body || `HTTP ${transcriptionResponse.status}`}`);
      }

      const result = await transcriptionResponse.json();
      const text = ((result && result.text) || "").trim();

      if (!text) {
        throw new Error("empty_transcription");
      }

      const recordResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/record_transcription`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id_param: userId,
          transcribed_text_param: text,
          credits_used_param: 1,
        }),
      });

      if (!recordResponse.ok) {
        const body = await readResponseText(recordResponse);
        throw new Error(`record_transcription_failed: status=${recordResponse.status} body=${body}`);
      }

      const recordRows = await recordResponse.json();
      const record = Array.isArray(recordRows) ? recordRows[0] : recordRows;

      return json(
        {
          text,
          remaining_credits: record?.remaining_credits ?? context.available_credits ?? null,
        },
        200,
        origin
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "transcription_failed";
      console.error("[Worker] Request failed", message);

      const status = message.includes("daily_limit_exceeded") ? 429 : 400;
      return json({ error: message }, status, origin);
    }
  },
};
