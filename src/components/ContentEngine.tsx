"use client";
import { useState, useCallback, useRef, useEffect } from "react";

const PRESETS = [
  { name: "Toast", url: "toast.tab.com", on: true },
  { name: "Square Restaurants", url: "squareup.com/restaurants", on: true },
  { name: "MarketMan", url: "marketman.com", on: false },
  { name: "7shifts", url: "7shifts.com", on: false },
  { name: "TouchBistro", url: "touchbistro.com", on: false },
  { name: "Lightspeed", url: "lightspeedcommerce.com", on: false },
  { name: "SpotOn", url: "spoton.com", on: false },
  { name: "Otter", url: "tryotter.com", on: false },
  { name: "Owner.com", url: "owner.com", on: false },
  { name: "Popmenu", url: "popmenu.com", on: false },
];

const CH = [
  { id: "blog", label: "Blog Post", icon: "📝" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "twitter", label: "X / Twitter", icon: "𝕏" },
  { id: "email", label: "Email", icon: "📧" },
  { id: "video", label: "Video Script", icon: "🎬" },
  { id: "ad", label: "Ad Copy", icon: "📢" },
];

const FOCUS = [
  "All Topics", "POS & Ordering", "Staff Management",
  "Inventory & Food Cost", "Marketing & Loyalty",
  "Analytics & Reporting", "Compliance & Back Office",
];

const B = {
  orange: "#FF6A3D", orangeLight: "#FFF4F0", orangeBorder: "#FFD0C0",
  navy: "#1A1F36", navyMid: "#2D3348",
  white: "#FFFFFF", bg: "#FAFBFC", border: "#E6E9F0", borderLight: "#F0F2F7",
  text: "#1A1F36", textMid: "#555B72", textMuted: "#8E94AB",
  green: "#1FAD5F", greenBg: "#EEFBF3", greenBorder: "#B8F0CF",
  amber: "#E5880B", amberBg: "#FEF7E8", amberBorder: "#FAD78B",
  red: "#DC3545", redBg: "#FEF0F1", redBorder: "#F9C4C8",
  purple: "#6F42C1", purpleBg: "#F5F0FF",
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Brief = {
  id: number;
  title: string;
  target_keyword: string;
  secondary_keywords?: string[];
  search_intent?: string;
  content_angle?: string;
  blog_outline?: string[];
  internal_links?: { text: string; url: string }[];
  linkedin_hook?: string;
  email_subject?: string;
  video_hook?: string;
  ad_headline?: string;
  cta?: string;
  priority?: string;
  estimated_effort?: string;
  cluster?: string;
};

type Gap = {
  gap_type: string; topic: string; description: string;
  competitors_covering?: string[]; aio_advantage?: string;
  aio_internal_link?: string; priority: string; search_volume?: string;
  difficulty?: string; content_type_recommended?: string;
  quick_win?: boolean; suggested_title?: string; target_keyword?: string;
  estimated_effort?: string; why_quick?: string;
};

type Discovery = {
  competitor: string; title: string; type: string; topic: string;
  angle?: string; seo_keyword?: string; traffic_value?: string;
};

// ─── Components ───
function Tag({ children, color = "gray", style: extra = {} }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) {
  const m: Record<string, { bg: string; c: string; b: string }> = {
    orange: { bg: B.orangeLight, c: B.orange, b: B.orangeBorder },
    green: { bg: B.greenBg, c: B.green, b: B.greenBorder },
    amber: { bg: B.amberBg, c: B.amber, b: B.amberBorder },
    red: { bg: B.redBg, c: B.red, b: B.redBorder },
    purple: { bg: B.purpleBg, c: B.purple, b: "#D2BFF0" },
    navy: { bg: "#ECEEF4", c: B.navy, b: "#D0D4E0" },
    gray: { bg: "#F2F3F7", c: B.textMid, b: B.border },
  };
  const s = m[color] || m.gray;
  return <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: s.bg, color: s.c, border: `1px solid ${s.b}`, whiteSpace: "nowrap", lineHeight: "18px", ...extra }}>{children}</span>;
}

function Btn({ children, primary, small, ghost, disabled, style: extra, onClick }: { children: React.ReactNode; primary?: boolean; small?: boolean; ghost?: boolean; disabled?: boolean; style?: React.CSSProperties; onClick?: () => void }) {
  const s = primary
    ? { background: B.orange, color: "#fff", border: "none", boxShadow: "0 1px 3px rgba(255,106,61,0.25)" }
    : ghost ? { background: "transparent", color: B.textMid, border: `1px solid ${B.border}` }
    : { background: B.white, color: B.navy, border: `1px solid ${B.border}` };
  return <button onClick={onClick} disabled={disabled} style={{ padding: small ? "6px 14px" : "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: small ? 12 : 13, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.45 : 1, transition: "all 0.15s", fontFamily: "inherit", letterSpacing: "-0.01em", ...s, ...extra }}>{children}</button>;
}

function Card({ children, glow, style: extra, onClick }: { children: React.ReactNode; glow?: boolean; style?: React.CSSProperties; onClick?: () => void }) {
  return <div onClick={onClick} style={{ background: B.white, border: `1px solid ${glow ? B.orangeBorder : B.border}`, borderRadius: 12, padding: 20, transition: "border-color 0.15s", ...(glow ? { boxShadow: "0 0 0 3px rgba(255,106,61,0.06)" } : {}), ...extra }}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 10 }}>{children}</div>;
}

function Stat({ label, value, sub, color }: { label: string; value: number; sub?: string; color?: string }) {
  return (
    <Card style={{ flex: 1, minWidth: 120, padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: B.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || B.navy, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: B.textMuted, marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

// ─── Main ───
export default function ContentEngine() {
  const [comps, setComps] = useState(PRESETS);
  const [customUrl, setCustomUrl] = useState("");
  const [focus, setFocus] = useState("All Topics");
  const [phase, setPhase] = useState<"input" | "scanning" | "results">("input");
  const [progress, setProgress] = useState(0);
  const [pLabel, setPLabel] = useState("");
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [quickWins, setQuickWins] = useState<Gap[]>([]);
  const [tab, setTab] = useState("dashboard");
  const [expBrief, setExpBrief] = useState<number | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [activeCh, setActiveCh] = useState("blog");
  const [genAllProg, setGenAllProg] = useState<{ briefId: number; current: string; done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef(false);
  const contentRef = useRef<Record<string, string>>({});

  useEffect(() => { contentRef.current = content; }, [content]);

  const sel = comps.filter((c) => c.on);
  const toggle = (i: number) => setComps((p) => p.map((c, idx) => idx === i ? { ...c, on: !c.on } : c));
  const addCustom = () => {
    if (!customUrl.trim()) return;
    const n = customUrl.replace(/https?:\/\//, "").replace(/www\./, "").split("/")[0];
    setComps((p) => [...p, { name: n, url: customUrl.trim(), on: true }]);
    setCustomUrl("");
  };

  const run = useCallback(async () => {
    if (sel.length === 0) return;
    abort.current = false;
    setPhase("scanning"); setProgress(0); setError(null);
    setDiscoveries([]); setGaps([]); setBriefs([]); setQuickWins([]);
    setContent({}); contentRef.current = {}; setExpBrief(null);

    try {
      setPLabel("Scanning competitor content…"); setProgress(15);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors: sel, focus }),
      });

      setProgress(80);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Analysis failed");
      }

      setPLabel("Processing results…"); setProgress(95);
      const data = await res.json();

      setDiscoveries(data.discoveries || []);
      setGaps(data.gaps || []);
      setBriefs(data.briefs || []);
      setQuickWins(data.quickWins || []);
      setProgress(100); setPLabel("Done");
      setTab("dashboard");
      setTimeout(() => setPhase("results"), 300);
    } catch (e) {
      if (!abort.current) {
        setError((e as Error).message);
        setPhase("input");
      }
    }
  }, [sel, focus]);

  const genContent = useCallback(async (brief: Brief, channel: string) => {
    const key = `${brief.id}-${channel}`;
    setGenerating(key);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, channel }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Generation failed");
      setContent((p) => ({ ...p, [key]: data.content }));
      contentRef.current[key] = data.content;
    } catch (e) {
      const msg = `Error: ${(e as Error).message}`;
      setContent((p) => ({ ...p, [key]: msg }));
      contentRef.current[key] = msg;
    }
    setGenerating(null);
  }, []);

  const genAll = useCallback(async (brief: Brief) => {
    setGenAllProg({ briefId: brief.id, current: "", done: 0, total: CH.length });
    for (let i = 0; i < CH.length; i++) {
      const ch = CH[i];
      const key = `${brief.id}-${ch.id}`;
      setGenAllProg((p) => p ? { ...p, current: ch.label, done: i } : null);
      if (!contentRef.current[key] || contentRef.current[key].startsWith("Error:")) {
        if (i > 0) await wait(1500);
        await genContent(brief, ch.id);
      }
      setGenAllProg((p) => p ? { ...p, done: i + 1 } : null);
    }
    setGenAllProg(null);
  }, [genContent]);

  const copy = (t: string) => { navigator.clipboard.writeText(t).catch(() => {}); };

  const base: React.CSSProperties = { fontFamily: "'Inter', -apple-system, system-ui, sans-serif", color: B.text, background: B.white, minHeight: "100vh" };

  const TABS = [
    { id: "dashboard", icon: "⚡", label: "Dashboard" },
    { id: "intel", icon: "🔍", label: "Intel", count: discoveries.length },
    { id: "gaps", icon: "🎯", label: "Gaps", count: gaps.length },
    { id: "lab", icon: "✍️", label: "Content Lab", count: briefs.length },
  ];

  const priColor: Record<string, string> = { high: "red", medium: "amber", low: "green" };
  const gapColor: Record<string, string> = { content_gap: "orange", opportunity_gap: "purple", keyword_gap: "green", serp_gap: "amber" };
  const gapLbl: Record<string, string> = { content_gap: "Content Gap", opportunity_gap: "Opportunity", keyword_gap: "Keyword", serp_gap: "SERP Gap" };

  if (phase === "input") return (
    <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 640, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: B.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", boxShadow: "0 2px 8px rgba(255,106,61,0.3)" }}>A</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: B.navy, letterSpacing: "-0.02em" }}>Content Intelligence Engine</div>
            <div style={{ fontSize: 11, color: B.textMuted }}>by AIO</div>
          </div>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: B.navy, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 8px" }}>Find what competitors publish.<br />Build what they missed.</h1>
        <p style={{ fontSize: 14, color: B.textMid, margin: "0 0 28px", lineHeight: 1.6 }}>Scans competitor content, maps gaps against AIO&apos;s product pillars, and generates SEO-optimized content with internal/external linking across 6 channels.</p>
        {error && <div style={{ background: B.redBg, border: `1px solid ${B.redBorder}`, borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: B.red }}>{error}</div>}
        <Card style={{ marginBottom: 16 }}>
          <SectionLabel>Competitors</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {comps.map((c, i) => (
              <button key={i} onClick={() => toggle(i)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit", border: c.on ? `2px solid ${B.orange}` : `1px solid ${B.border}`, background: c.on ? B.orangeLight : B.white, color: c.on ? B.orange : B.textMid, fontWeight: c.on ? 700 : 400, transition: "all 0.12s" }}>{c.name}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()} placeholder="Add custom competitor URL…" style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: `1px solid ${B.border}`, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <Btn onClick={addCustom}>Add</Btn>
          </div>
        </Card>
        <Card style={{ marginBottom: 24 }}>
          <SectionLabel>Focus Area</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {FOCUS.map((f) => <button key={f} onClick={() => setFocus(f)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: focus === f ? `2px solid ${B.orange}` : `1px solid ${B.border}`, background: focus === f ? B.orangeLight : B.white, color: focus === f ? B.orange : B.textMid, fontWeight: focus === f ? 700 : 400 }}>{f}</button>)}
          </div>
        </Card>
        <Btn primary onClick={run} disabled={sel.length === 0} style={{ width: "100%", padding: 15, fontSize: 15, borderRadius: 10 }}>
          Analyze {sel.length} competitor{sel.length !== 1 ? "s" : ""} →
        </Btn>
      </div>
    </div>
  );

  if (phase === "scanning") return (
    <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}`}</style>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: B.orange, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", boxShadow: "0 4px 20px rgba(255,106,61,0.3)", animation: "pulse 2s infinite" }}>A</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: B.navy, marginBottom: 6 }}>{pLabel}</div>
        <div style={{ fontSize: 13, color: B.textMuted, marginBottom: 20 }}>This takes 45-90 seconds. The AI is actually searching the web.</div>
        <div style={{ height: 5, background: B.borderLight, borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${B.orange}, #FF8F6B)`, borderRadius: 3, transition: "width 0.5s ease" }} />
        </div>
        <Btn ghost onClick={() => { abort.current = true; setPhase("input"); }}>Cancel</Btn>
      </div>
    </div>
  );

  const hiGaps = gaps.filter((g) => g.priority === "high").length;

  return (
    <div style={{ ...base, display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${B.border}`, padding: "20px 0", display: "flex", flexDirection: "column", gap: 2, position: "sticky" as const, top: 0, height: "100vh", background: B.white }}>
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${B.border}`, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: B.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>A</div>
            <span style={{ fontSize: 14, fontWeight: 800, color: B.navy, letterSpacing: "-0.02em" }}>Content Engine</span>
          </div>
          <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4 }}>by AIO</div>
        </div>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", borderRight: tab === t.id ? `3px solid ${B.orange}` : "3px solid transparent", background: tab === t.id ? B.orangeLight : "transparent", color: tab === t.id ? B.orange : B.textMid, fontWeight: tab === t.id ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const, transition: "all 0.12s" }}>
            <span style={{ fontSize: 16, width: 22, textAlign: "center" as const }}>{t.icon}</span>
            <span>{t.label}</span>
            {t.count != null && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, background: tab === t.id ? B.orange : B.border, color: tab === t.id ? "#fff" : B.textMid, padding: "1px 7px", borderRadius: 10 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "24px 32px", maxWidth: 820, minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: B.navy, letterSpacing: "-0.02em" }}>
              {tab === "dashboard" && "Dashboard"}{tab === "intel" && "Competitor Intel"}{tab === "gaps" && "Content Gaps"}{tab === "lab" && "Content Lab"}
            </div>
            <div style={{ fontSize: 12, color: B.textMuted, marginTop: 2 }}>{sel.map((c) => c.name).join(", ")}{focus !== "All Topics" ? ` · ${focus}` : ""}</div>
          </div>
          <Btn small ghost onClick={() => { setPhase("input"); setError(null); }}>← New Analysis</Btn>
        </div>

        {error && <div style={{ background: B.amberBg, border: `1px solid ${B.amberBorder}`, borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: B.amber }}>⚠ {error}</div>}

        {/* Dashboard */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <Stat label="Competitor Content" value={discoveries.length} sub="pieces found" />
              <Stat label="Content Gaps" value={gaps.length} sub={`${hiGaps} high priority`} color={B.red} />
              <Stat label="Briefs Ready" value={briefs.length} sub="multi-channel" color={B.orange} />
              <Stat label="Quick Wins" value={quickWins.length} sub="ship this week" color={B.green} />
            </div>
            {quickWins.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Tag color="green" style={{ fontSize: 12 }}>QUICK WINS</Tag>
                  <span style={{ fontSize: 14, fontWeight: 600, color: B.navy }}>Low effort, high impact — publish first</span>
                </div>
                {quickWins.map((q, i) => (
                  <Card key={i} style={{ marginBottom: 8, borderLeft: `3px solid ${B.green}`, cursor: "pointer", padding: 16 }}
                    onClick={() => { setTab("lab"); const m = briefs.find((b) => b.target_keyword === q.target_keyword); if (m) setExpBrief(m.id); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: B.navy, marginBottom: 2 }}>{q.suggested_title || q.topic}</div>
                        <div style={{ fontSize: 12, color: B.textMid }}>{q.why_quick}</div>
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <Tag color="green">{q.estimated_effort}</Tag>
                        <Tag color="orange">{q.target_keyword}</Tag>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {briefs.length > 0 && (() => {
              const cl: Record<string, Brief[]> = {};
              briefs.forEach((b) => { const c = b.cluster || "General"; if (!cl[c]) cl[c] = []; cl[c].push(b); });
              return (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: B.navy, marginBottom: 12 }}>Topic Clusters</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                    {Object.entries(cl).map(([name, items]) => (
                      <Card key={name} style={{ cursor: "pointer", padding: 16 }} onClick={() => setTab("lab")}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: B.navy, marginBottom: 8 }}>{name}</div>
                        {items.map((b, i) => <div key={i} style={{ fontSize: 12, color: B.textMid, marginBottom: 4, paddingLeft: 10, borderLeft: `2px solid ${B.orangeBorder}` }}>{b.title}</div>)}
                        <div style={{ fontSize: 11, color: B.orange, marginTop: 8, fontWeight: 600 }}>{items.length} piece{items.length > 1 ? "s" : ""} → topical authority</div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Intel */}
        {tab === "intel" && (
          <div style={{ display: "grid", gap: 8 }}>
            {discoveries.length === 0 && <div style={{ color: B.textMuted, fontSize: 14, padding: 40, textAlign: "center" }}>No competitor content found.</div>}
            {discoveries.map((d, i) => (
              <Card key={i} style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 3 }}>{d.title}</div>
                <div style={{ fontSize: 12, color: B.textMid, marginBottom: 8 }}>{d.angle}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <Tag color="navy">{d.competitor}</Tag>
                  <Tag color="orange">{d.type?.replace(/_/g, " ")}</Tag>
                  {d.seo_keyword && <Tag color="green">{d.seo_keyword}</Tag>}
                  {d.traffic_value && <Tag color={d.traffic_value === "high" ? "amber" : "gray"}>Traffic: {d.traffic_value}</Tag>}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Gaps */}
        {tab === "gaps" && (
          <div style={{ display: "grid", gap: 10 }}>
            {gaps.length === 0 && <div style={{ color: B.textMuted, fontSize: 14, padding: 40, textAlign: "center" }}>No gaps identified.</div>}
            {gaps.map((g, i) => (
              <Card key={i} style={{ padding: 16, borderLeft: `3px solid ${g.priority === "high" ? B.red : g.priority === "medium" ? B.amber : B.green}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: B.navy }}>{g.topic}</span>
                  <div style={{ display: "flex", gap: 5 }}>
                    <Tag color={priColor[g.priority]}>{g.priority}</Tag>
                    <Tag color={gapColor[g.gap_type]}>{gapLbl[g.gap_type] || g.gap_type}</Tag>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: B.textMid, marginBottom: 8 }}>{g.description}</div>
                {g.aio_advantage && <div style={{ fontSize: 12, color: B.green, background: B.greenBg, padding: "8px 12px", borderRadius: 8, marginBottom: 8 }}><strong>AIO edge:</strong> {g.aio_advantage}</div>}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {g.search_volume && <Tag>Vol: {g.search_volume}</Tag>}
                  {g.difficulty && <Tag>Effort: {g.difficulty}</Tag>}
                  {g.content_type_recommended && <Tag color="purple">{g.content_type_recommended}</Tag>}
                  {g.aio_internal_link && <Tag color="orange">→ {g.aio_internal_link}</Tag>}
                  {(g.competitors_covering || []).map((c, ci) => <Tag key={ci} color="amber">{c}</Tag>)}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Content Lab */}
        {tab === "lab" && (
          <div style={{ display: "grid", gap: 12 }}>
            {briefs.length === 0 && <div style={{ color: B.textMuted, fontSize: 14, padding: 40, textAlign: "center" }}>No briefs generated.</div>}
            {briefs.map((b) => {
              const isExp = expBrief === b.id;
              const isGenAll = genAllProg?.briefId === b.id;
              return (
                <Card key={b.id} glow={isExp} style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "18px 20px", cursor: "pointer" }} onClick={() => setExpBrief(isExp ? null : b.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: B.navy, marginBottom: 4 }}>{b.title}</div>
                        <div style={{ fontSize: 12, color: B.textMid, marginBottom: 8 }}>{b.content_angle}</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          <Tag color="orange">{b.target_keyword}</Tag>
                          {(b.secondary_keywords || []).slice(0, 3).map((k, ki) => <Tag key={ki}>{k}</Tag>)}
                          {b.priority && <Tag color={priColor[b.priority]}>{b.priority}</Tag>}
                          {b.estimated_effort && <Tag color="purple">{b.estimated_effort}</Tag>}
                        </div>
                      </div>
                      <span style={{ fontSize: 14, color: B.textMuted, transform: isExp ? "rotate(180deg)" : "none", transition: "0.15s", marginLeft: 8, marginTop: 4 }}>▾</span>
                    </div>
                  </div>
                  {isExp && (
                    <div style={{ borderTop: `1px solid ${B.borderLight}`, padding: "20px" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                        <div>
                          <SectionLabel>Blog Outline</SectionLabel>
                          <ol style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: B.textMid, lineHeight: 1.8 }}>
                            {(b.blog_outline || []).map((s, si) => <li key={si}>{s}</li>)}
                          </ol>
                          {(b.internal_links || []).length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <SectionLabel>Internal Links</SectionLabel>
                              {(b.internal_links || []).map((l, li) => <div key={li} style={{ fontSize: 12, color: B.orange, marginBottom: 3 }}>"{l.text}" → <span style={{ color: B.textMid }}>{l.url}</span></div>)}
                            </div>
                          )}
                        </div>
                        <div>
                          {([["LinkedIn Hook", b.linkedin_hook], ["Email Subject", b.email_subject], ["Video Hook", b.video_hook], ["Ad Headline", b.ad_headline], ["CTA", b.cta]] as [string, string | undefined][]).filter(([, v]) => v).map(([label, val]) => (
                            <div key={label} style={{ marginBottom: 12 }}>
                              <SectionLabel>{label}</SectionLabel>
                              <div style={{ fontSize: 13, color: B.textMid }}>{val}</div>
                            </div>
                          ))}
                          {b.cluster && <div><SectionLabel>Cluster</SectionLabel><Tag color="purple">{b.cluster}</Tag></div>}
                        </div>
                      </div>
                      <div style={{ background: B.bg, borderRadius: 10, padding: 16, border: `1px solid ${B.borderLight}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <SectionLabel>Generate Content</SectionLabel>
                          <Btn small primary onClick={() => genAll(b)} disabled={!!genAllProg}>
                            {isGenAll ? `${genAllProg.current || "Starting"}… (${genAllProg.done}/${genAllProg.total})` : "⚡ Generate All Channels"}
                          </Btn>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                          {CH.map((ch) => {
                            const k = `${b.id}-${ch.id}`;
                            const has = content[k] && !content[k].startsWith("Error:");
                            const hasErr = content[k]?.startsWith("Error:");
                            const isGen = generating === k;
                            return (
                              <button key={ch.id} onClick={() => { setActiveCh(ch.id); if (!content[k] && !isGen) genContent(b, ch.id); }} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: activeCh === ch.id ? `2px solid ${B.orange}` : `1px solid ${B.border}`, background: has ? B.orangeLight : hasErr ? B.redBg : B.white, fontWeight: activeCh === ch.id ? 700 : 500, color: activeCh === ch.id ? B.orange : has ? B.orange : hasErr ? B.red : B.textMid, transition: "all 0.1s" }}>
                                {ch.icon} {ch.label} {has ? "✓" : hasErr ? "✗" : isGen ? "…" : ""}
                              </button>
                            );
                          })}
                        </div>
                        {generating === `${b.id}-${activeCh}` && (
                          <div style={{ padding: 28, textAlign: "center" }}>
                            <div style={{ fontSize: 13, color: B.textMid, marginBottom: 10 }}>
                              {(activeCh === "blog" || activeCh === "linkedin") ? "Searching web for current data…" : `Writing ${CH.find((c) => c.id === activeCh)?.label}…`}
                            </div>
                          </div>
                        )}
                        {content[`${b.id}-${activeCh}`] && generating !== `${b.id}-${activeCh}` && (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: B.textMid }}>{CH.find((c) => c.id === activeCh)?.icon} {CH.find((c) => c.id === activeCh)?.label}</span>
                              <div style={{ display: "flex", gap: 6 }}>
                                {content[`${b.id}-${activeCh}`]?.startsWith("Error:") && <Btn small ghost onClick={() => genContent(b, activeCh)}>Retry</Btn>}
                                <Btn small onClick={() => copy(content[`${b.id}-${activeCh}`])}>Copy</Btn>
                              </div>
                            </div>
                            <div style={{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 10, padding: 18, fontSize: 13, lineHeight: 1.8, color: content[`${b.id}-${activeCh}`]?.startsWith("Error:") ? B.red : B.text, whiteSpace: "pre-wrap", maxHeight: 500, overflowY: "auto" }}>
                              {content[`${b.id}-${activeCh}`]}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
