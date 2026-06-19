import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

async function callAnthropic(
  messages: object[],
  system: string,
  useSearch = false,
  retries = 2
): Promise<object> {
  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system,
    messages,
  };
  if (useSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429 || res.status === 529) {
      if (attempt < retries) { await wait(3000 * (attempt + 1)); continue; }
    }
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${errText}`);
    }
    return res.json();
  }
  throw new Error("Max retries exceeded");
}

function extractText(data: { content?: Array<{ type: string; text?: string }> }): string {
  return (data.content || [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text!)
    .join("\n");
}

function parseJSON(text: string): unknown {
  const clean = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const starts: { i: number; o: string; cl: string }[] = [];
  const oi = clean.indexOf("{");
  const ai = clean.indexOf("[");
  if (oi >= 0) starts.push({ i: oi, o: "{", cl: "}" });
  if (ai >= 0) starts.push({ i: ai, o: "[", cl: "]" });
  starts.sort((a, b) => a.i - b.i);
  for (const { i, o, cl } of starts) {
    let depth = 0;
    for (let j = i; j < clean.length; j++) {
      if (clean[j] === o) depth++;
      else if (clean[j] === cl) {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(clean.slice(i, j + 1)); } catch { break; }
        }
      }
    }
  }
  throw new Error("No valid JSON in response");
}

const AIO_PAGES = {
  Marketing: "https://aioapp.com/collections/marketing",
  "Order & Pay": "https://aioapp.com/collections/order-and-pay",
  Staff: "https://aioapp.com/collections/staff",
  Inventory: "https://aioapp.com/collections/inventory",
  Office: "https://aioapp.com/collections/office",
  Analytics: "https://aioapp.com/collections/analytics",
  Homepage: "https://aioapp.com",
  Pricing: "https://aioapp.com/pages/pricing",
};

export async function POST(req: NextRequest) {
  try {
    const { competitors, focus } = await req.json();
    const clist = competitors.map((c: { name: string; url: string }) => `${c.name} (${c.url})`).join(", ");
    const ff = focus && focus !== "All Topics" ? ` Focus on: ${focus}.` : "";

    // Step 1 — Discovery
    const d1 = await callAnthropic(
      [{ role: "user", content: `Search for recent blog posts, landing pages, feature pages, case studies, guides, and marketing content from these restaurant tech competitors: ${clist}.${ff}

Find their content marketing: blog titles, page angles, feature messaging, SEO keywords, content formats.

Return ONLY a JSON array (no markdown) of 12-18 objects:
- "competitor": company name
- "title": content title
- "type": "blog"|"landing_page"|"feature_page"|"case_study"|"guide"|"comparison"|"announcement"
- "topic": core topic
- "angle": messaging angle (1 sentence)
- "seo_keyword": likely target keyword
- "traffic_value": "high"|"medium"|"low"` }],
      "Competitive intelligence analyst for restaurant tech. Return ONLY valid JSON array.",
      true
    ) as { content?: Array<{ type: string; text?: string }> };

    let discoveries: unknown[] = [];
    try { discoveries = parseJSON(extractText(d1)) as unknown[]; } catch (e) { console.error("Discovery parse:", e); }
    if (!Array.isArray(discoveries)) discoveries = [];

    // Step 2 — Gap analysis
    const d2 = await callAnthropic(
      [{ role: "user", content: `Analyze content gaps for AIO (aioapp.com), an all-in-one AI restaurant management platform.

AIO pillars: Marketing, Order & Pay, Staff, Inventory, Office, Analytics.
AIO pages: ${JSON.stringify(AIO_PAGES)}

Competitor content found:
${JSON.stringify(discoveries, null, 2)}

Return ONLY a JSON array of 8-12 gap objects:
- "gap_type": "content_gap"|"opportunity_gap"|"keyword_gap"|"serp_gap"
- "topic": topic/keyword
- "description": one sentence
- "competitors_covering": [names]
- "aio_advantage": how AIO wins here
- "aio_internal_link": which AIO page (from: ${Object.keys(AIO_PAGES).join(", ")})
- "priority": "high"|"medium"|"low"
- "search_volume": "high"|"medium"|"low"
- "difficulty": "easy"|"medium"|"hard"
- "content_type_recommended": best format
- "quick_win": true if easy + high/medium volume
- "suggested_title": blog title
- "target_keyword": primary keyword
- "estimated_effort": "1-2 hours"|"half day"|"full day"
- "why_quick": one sentence if quick_win, null otherwise

Sort by priority. JSON array only.` }],
      "Content strategy expert, restaurant B2B SaaS. ONLY a valid JSON array. No markdown.",
      false
    ) as { content?: Array<{ type: string; text?: string }> };

    let gaps: unknown[] = [];
    try { gaps = parseJSON(extractText(d2)) as unknown[]; } catch (e) { console.error("Gap parse:", e); }
    if (!Array.isArray(gaps)) gaps = [];

    // Step 3 — Briefs
    const topGaps = gaps.slice(0, 8);
    let briefs: unknown[] = [];

    if (topGaps.length > 0) {
      const d3 = await callAnthropic(
        [{ role: "user", content: `Create content briefs for these AIO content gaps:

${JSON.stringify(topGaps, null, 2)}

AIO pages: ${JSON.stringify(AIO_PAGES)}

For each, return:
- "id": sequential number
- "title": keyword-optimized blog title
- "target_keyword": primary keyword
- "secondary_keywords": [3-4 keywords]
- "search_intent": "informational"|"commercial"|"transactional"
- "content_angle": AIO's unique angle (2 sentences)
- "blog_outline": [5-7 headings]
- "internal_links": [{"text": anchor, "url": AIO URL}] 2-3 links
- "linkedin_hook": first line
- "email_subject": subject line
- "video_hook": first 3 seconds
- "ad_headline": headline
- "cta": call to action
- "priority": "high"|"medium"|"low"
- "estimated_effort": time
- "cluster": topic cluster name

Return ONLY a JSON array.` }],
        "Senior content strategist, restaurant tech. Sharp tone. ONLY valid JSON array.",
        false
      ) as { content?: Array<{ type: string; text?: string }> };

      try { briefs = parseJSON(extractText(d3)) as unknown[]; } catch (e) { console.error("Brief parse:", e); }
      if (!Array.isArray(briefs)) briefs = [];
    }

    return NextResponse.json({ discoveries, gaps, briefs, quickWins: gaps.filter((g) => (g as Record<string, unknown>).quick_win) });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
