import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

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

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callAnthropic(
  messages: object[],
  system: string,
  useSearch = false,
  retries = 2
): Promise<{ content?: Array<{ type: string; text?: string }> }> {
  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system,
    messages,
  };
  if (useSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

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
      const t = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${t}`);
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

export async function POST(req: NextRequest) {
  try {
    const { brief, channel } = await req.json();

    const links = brief.internal_links?.length
      ? `\nINCLUDE INTERNAL LINKS:\n${brief.internal_links.map((l: { text: string; url: string }) => `"${l.text}" → ${l.url}`).join("\n")}`
      : "";

    const sys = `Senior content writer for AIO (aioapp.com), all-in-one AI restaurant management platform. Brand voice: sharp, operational, confident, occasionally sardonic. No em dashes EVER. No filler. Specificity over abstraction.
AIO pillars: Marketing, Order & Pay, Staff, Inventory, Office, Analytics.
Pages: ${JSON.stringify(AIO_PAGES)}`;

    const ctx = `Title: ${brief.title}
Keyword: ${brief.target_keyword}
Secondary: ${(brief.secondary_keywords || []).join(", ")}
Angle: ${brief.content_angle}
Outline: ${JSON.stringify(brief.blog_outline)}
LinkedIn hook: ${brief.linkedin_hook || ""}
Email subject: ${brief.email_subject || ""}
Video hook: ${brief.video_hook || ""}
Ad headline: ${brief.ad_headline || ""}
CTA: ${brief.cta || ""}`;

    const prompts: Record<string, string> = {
      blog: `Search the web for current data about "${brief.target_keyword}" in the restaurant industry. Write a full SEO blog post (1000-1500 words).

${ctx}

Rules:
- Use the outline as structure
- Weave in target + secondary keywords naturally
- 2-3 EXTERNAL LINKS to real sources found via search [anchor](URL)${links}
- Key Takeaways section near top
- Meta description (155 chars) + title tag (60 chars) at top
- ## headings, short paragraphs, bold for scanability
- End with CTA to AIO`,

      linkedin: `Search the web for a current stat about "${brief.target_keyword}". Write a LinkedIn post (180-280 words).

${ctx}

Rules:
- Open with the hook provided
- Include one current stat from research
- Short paragraphs for mobile
- Soft CTA + AIO link at end
- Max 3 hashtags`,

      twitter: `Write an X/Twitter thread (5-7 tweets) about "${brief.target_keyword}".

${ctx}

Rules:
- Tweet 1: bold claim or question
- Each tweet under 280 chars, one clear point
- Data points where possible
- Last tweet: CTA with AIO link
- 1-2 hashtags max on last tweet only`,

      email: `Write a marketing email (400-600 words) for restaurant owners about "${brief.target_keyword}".

${ctx}

Rules:
- Subject: ${brief.email_subject || brief.title}
- Preview text (50 chars)
- Open with relatable pain point
- Value-packed middle, not just product pitch
- One clear CTA button
- P.S. with secondary hook`,

      video: `Write a 60-90 second video script about "${brief.target_keyword}".

${ctx}

Rules:
- [VISUAL] and [VOICEOVER] alternating
- Hook in first 3 seconds
- Problem → Agitation → Solution (AIO) → Proof → CTA
- One surprising data point
- Suggested b-roll notes`,

      ad: `Write ad copy for "${brief.target_keyword}" promoting AIO.

${ctx}

Create:
GOOGLE ADS (3 variations): Headline 1-3 (30 chars each), Description 1-2 (90 chars each)
META ADS (2 variations): Primary text (125 words), Headline (40 chars), Description (30 chars), CTA button
Each variation: different angle (feature / pain point / social proof).`,
    };

    const useSearch = channel === "blog" || channel === "linkedin";
    const prompt = prompts[channel];
    if (!prompt) throw new Error(`Unknown channel: ${channel}`);

    const data = await callAnthropic([{ role: "user", content: prompt }], sys, useSearch);
    const result = extractText(data);
    if (!result || result.trim().length < 20) throw new Error("Empty response from API");

    return NextResponse.json({ content: result });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
