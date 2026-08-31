const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

interface Body {
  mode?: "parse" | "tidy";
  transcript?: string;
  service?: string;
  hint?: string;
  checklist?: { id: string; label: string }[];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGateway(apiKey: string, messages: unknown[], jsonMode: boolean) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    console.error(`AI gateway failed [${res.status}]: ${details}`);
    const message =
      res.status === 429
        ? "Too many requests just now — try again in a moment."
        : res.status === 402
          ? "The workspace is out of AI credits."
          : "The assistant is unavailable right now.";
    return { error: message, status: res.status } as const;
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  return { text } as const;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured for this app." }, 500);

    const body = (await req.json()) as Body;
    const transcript = (body.transcript ?? "").toString().slice(0, 4000).trim();
    if (!transcript) return json({ error: "Nothing to work with." }, 400);

    if (body.mode === "tidy") {
      const result = await callGateway(
        apiKey,
        [
          {
            role: "system",
            content:
              "You tidy up notes written by a tradesperson on a job. Return only the tidied text: plain British English, short sentences or short bullet lines, no headings, no preamble, no invented facts. Keep every fact exactly as given.",
          },
          { role: "user", content: `${body.hint ?? ""}\n\nNotes:\n${transcript}` },
        ],
        false,
      );
      if ("error" in result) return json({ error: result.error }, result.status);
      return json({ text: result.text.trim() });
    }

    const checklist = (body.checklist ?? []).slice(0, 20);
    const result = await callGateway(
      apiKey,
      [
        {
          role: "system",
          content:
            "You turn a tradesperson's spoken summary of a job into job-sheet fields. Reply with JSON only, using these keys: " +
            'workDone (string), partsUsed (string), extraWorkNote (string, work spotted but not done), extraWorkValue (string, digits only, "" if unknown), checks (array of check ids that the words clearly confirm). ' +
            "Use British English. Never invent facts that were not said. Leave a field as an empty string if it was not mentioned. " +
            `Available check ids: ${JSON.stringify(checklist)}`,
        },
        {
          role: "user",
          content: `Job type: ${body.service ?? "general"}\n\nWhat the worker said:\n${transcript}`,
        },
      ],
      true,
    );
    if ("error" in result) return json({ error: result.error }, result.status);

    let parsed: unknown = {};
    try {
      parsed = JSON.parse(result.text);
    } catch {
      const match = result.text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    return json({ result: parsed });
  } catch (e) {
    console.error("field-notes failed", e);
    return json({ error: (e as Error).message ?? "Something went wrong." }, 500);
  }
});
