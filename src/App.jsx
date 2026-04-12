import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── Constants ──
const NAMES = ["Alessio", "Andrea", "Francesco", "Jacopo", "Luca"];
const COLORS = {
  Alessio: "#7dd3fc",
  Andrea: "#3d405b",
  Francesco: "#81b29a",
  Jacopo: "#f2cc8f",
  Luca: "#d4726a",
};

// ── Helpers ──
function fmtDate(d) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtDateLong(d) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ── Shared tooltip ──
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{fmtDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ margin: "2px 0", color: p.color }}>
          {p.dataKey}: <strong>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Stat card ──
function StatCard({ label, value, unit, badge, badgeColor = "green" }) {
  const bgMap = { green: "#dcfce7", amber: "#fef3c7", red: "#fee2e2", blue: "#dbeafe" };
  const fgMap = { green: "#166534", amber: "#92400e", red: "#991b1b", blue: "#1e40af" };
  return (
    <div className="card">
      <p className="card-label">{label}</p>
      <div className="card-value-row">
        <span className="card-value">{value}</span>
        {unit && <span className="card-unit">{unit}</span>}
      </div>
      {badge && (
        <span className="card-badge" style={{ background: bgMap[badgeColor], color: fgMap[badgeColor] }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Section ──
function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="section">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      {children}
    </section>
  );
}

// ── Nav pill ──
function NavPill({ icon, label, href }) {
  return (
    <a href={href} className="nav-pill">
      <span className="nav-pill-icon">{icon}</span>
      <span className="nav-pill-label">{label}</span>
    </a>
  );
}

// ── Loading skeleton ──
function LoadingSkeleton() {
  return (
    <div className="wrapper" style={{ textAlign: "center", paddingTop: 120 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>💩</div>
      <p className="loading-pulse" style={{ fontSize: 18, color: "#7a7265", fontFamily: "'Playfair Display', Georgia, serif" }}>
        Loading the data...
      </p>
    </div>
  );
}

// ── Error state ──
function ErrorState({ message }) {
  return (
    <div className="wrapper" style={{ textAlign: "center", paddingTop: 120 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😬</div>
      <p style={{ fontSize: 16, color: "#991b1b" }}>Failed to load data</p>
      <p style={{ fontSize: 13, color: "#7a7265", marginTop: 8 }}>{message}</p>
    </div>
  );
}

// ══════════════════════════════════════════
// ══  MAIN APP
// ══════════════════════════════════════════
export default function App() {
  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState("all");

  // ── Fetch CSV on mount ──
  useEffect(() => {
  const csvUrl =
    import.meta.env.VITE_SHEET_CSV_URL ||
    `${import.meta.env.BASE_URL}data_shit.csv`;

  const sep = csvUrl.includes("?") ? "&" : "?";

  fetch(`${csvUrl}${sep}ts=${Date.now()}`, {
    cache: "no-store",
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((text) => {
      const result = Papa.parse(text.trim(), {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      if (result.errors.length) {
        console.warn("CSV parse warnings:", result.errors);
      }

      setRawData(result.data);
    })
    .catch((err) => setError(err.message));
}, []);

  // ── Parse into our format ──
  const data = useMemo(() => {
    if (!rawData) return null;
    return rawData.map((row) => {
      const r = { date: row.Date };
      let sum = 0;
      NAMES.forEach((n) => {
        r[n] = Number(row[n]) || 0;
        sum += r[n];
      });
      r.Sum = sum;
      return r;
    });
  }, [rawData]);

  // ── Derived stats ──
  const stats = useMemo(() => {
    if (!data) return null;
    const totalDays = data.length;
    const totalShits = data.reduce((s, r) => s + r.Sum, 0);
    const avgPerDay = (totalShits / totalDays).toFixed(1);

    const personAvg = {};
    const personMax = {};
    const personTotal = {};
    const personMaxDate = {};

    NAMES.forEach((n) => {
      const vals = data.map((r) => r[n]);
      personTotal[n] = vals.reduce((a, b) => a + b, 0);
      personAvg[n] = (personTotal[n] / totalDays).toFixed(2);
      personMax[n] = Math.max(...vals);
      personMaxDate[n] = data.find((r) => r[n] === personMax[n])?.date;
    });

    const champion = NAMES.reduce((a, b) => (personTotal[a] >= personTotal[b] ? a : b));
    const maxSingleDay = Math.max(...data.map((r) => r.Sum));
    const maxDayDate = data.find((r) => r.Sum === maxSingleDay)?.date;
    const zeroDays = {};
    NAMES.forEach((n) => { zeroDays[n] = data.filter((r) => r[n] === 0).length; });

    return { totalDays, totalShits, avgPerDay, personAvg, personMax, personTotal, personMaxDate, champion, maxSingleDay, maxDayDate, zeroDays };
  }, [data]);

  // ── Cumulative ──
  const cumData = useMemo(() => {
    if (!data) return [];
    const cum = {};
    NAMES.forEach((n) => (cum[n] = 0));
    return data.map((r) => {
      const row = { date: r.date };
      NAMES.forEach((n) => {
        cum[n] += r[n];
        row[n] = cum[n];
      });
      return row;
    });
  }, [data]);

  // ── Weekly averages ──
  const weeklyData = useMemo(() => {
    if (!data) return [];
    const weeks = [];
    for (let i = 0; i < data.length; i += 7) {
      const chunk = data.slice(i, i + 7);
      const row = { week: `W${Math.floor(i / 7) + 1}`, date: chunk[0].date };
      NAMES.forEach((n) => {
        row[n] = +(chunk.reduce((s, r) => s + r[n], 0) / chunk.length).toFixed(2);
      });
      row.Sum = +(chunk.reduce((s, r) => s + r.Sum, 0) / chunk.length).toFixed(2);
      weeks.push(row);
    }
    return weeks;
  }, [data]);

  // ── Render ──
  if (error) return <ErrorState message={error} />;
  if (!data || !stats) return <LoadingSkeleton />;

  const { totalDays, totalShits, avgPerDay, personAvg, personMax, personTotal, personMaxDate, champion, maxSingleDay, maxDayDate, zeroDays } = stats;
  const progress = ((totalDays / 365) * 100).toFixed(1);
  const projected = Math.round((totalShits / totalDays) * 365);

  const xAxisProps = {
    dataKey: "date",
    tickFormatter: fmtDate,
    tick: { fontSize: 10, fill: "#7a7265" },
    interval: Math.max(Math.floor(data.length / 7) - 1, 0),
    axisLine: { stroke: "rgba(30,27,22,0.15)" },
    tickLine: false,
  };
  const yAxisProps = {
    tick: { fontSize: 10, fill: "#7a7265" },
    axisLine: false,
    tickLine: false,
  };
  const gridProps = {
    strokeDasharray: "3 3",
    stroke: "rgba(30,27,22,0.08)",
  };

  return (
    <>
      <style>{`
        .wrapper { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }

        /* ── Header ── */
        .header { margin-bottom: 32px; }
        .header-row { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
        .header-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(28px, 5vw, 44px);
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .header-tagline {
          font-size: 16px; font-style: italic; color: #7a7265; font-weight: 500;
        }
        .header-privacy { font-size: 13px; color: #7a7265; margin-top: 8px; }

        /* ── Cards ── */
        .card {
          background: rgba(246,241,232,0.6);
          border: 1px solid rgba(30,27,22,0.08);
          border-radius: 10px;
          padding: 14px 16px;
          transition: border-color 0.2s;
        }
        .card:hover { border-color: rgba(30,27,22,0.2); }
        .card-label {
          font-size: 11px; font-weight: 600; color: #7a7265;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .card-value-row { display: flex; align-items: baseline; gap: 6px; margin-top: 6px; }
        .card-value {
          font-size: 28px; font-family: 'Playfair Display', Georgia, serif;
          font-weight: 700; color: #1e1b16; line-height: 1;
        }
        .card-unit { font-size: 12px; color: #7a7265; }
        .card-badge {
          display: inline-block; margin-top: 6px; font-size: 10px;
          font-weight: 700; padding: 2px 8px; border-radius: 999px;
        }

        /* ── Grid ── */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        /* ── Sections ── */
        .section { margin-top: 48px; }
        .section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px; font-weight: 700; color: #1e1b16; margin-bottom: 4px;
        }
        .section-subtitle { font-size: 13px; color: #7a7265; margin-bottom: 16px; }

        /* ── Nav pills ── */
        .nav-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 32px; }
        .nav-pill {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          border-radius: 10px; border: 1px solid rgba(30,27,22,0.08);
          background: rgba(246,241,232,0.6); padding: 12px 8px;
          text-decoration: none; color: #1e1b16;
          transition: background 0.2s, border-color 0.2s; min-width: 80px;
        }
        .nav-pill:hover { background: rgba(237,230,218,0.8); border-color: rgba(30,27,22,0.18); }
        .nav-pill-icon { font-size: 22px; }
        .nav-pill-label { font-size: 11px; font-weight: 600; }

        /* ── Progress bar ── */
        .progress-panel {
          background: rgba(246,241,232,0.6);
          border: 1px solid rgba(30,27,22,0.08);
          border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;
        }
        .progress-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px; font-weight: 700; margin-bottom: 10px;
        }
        .progress-track {
          width: 100%; background: rgba(30,27,22,0.08);
          border-radius: 999px; height: 14px; overflow: hidden;
        }
        .progress-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #81b29a, #3d8b6e);
          transition: width 0.5s;
        }
        .progress-label { font-size: 12px; color: #7a7265; margin-top: 6px; }

        /* ── Tooltip ── */
        .chart-tooltip {
          background: rgba(246,241,232,0.97);
          border: 1px solid rgba(30,27,22,0.12);
          border-radius: 10px; padding: 10px 14px;
          font-size: 12px; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 20px rgba(30,27,22,0.08);
        }
        .chart-tooltip-label { font-weight: 700; margin-bottom: 4px; color: #1e1b16; }

        /* ── Person record cards ── */
        .person-card {
          background: rgba(246,241,232,0.6);
          border: 1px solid rgba(30,27,22,0.08);
          border-radius: 10px; padding: 14px 16px;
          transition: border-color 0.2s;
        }
        .person-card:hover { border-color: rgba(30,27,22,0.2); }
        .person-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .person-dot { width: 10px; height: 10px; border-radius: 999px; }
        .person-name {
          font-weight: 700; font-size: 14px;
          font-family: 'Playfair Display', Georgia, serif;
        }
        .person-stat {
          display: flex; justify-content: space-between;
          font-size: 12px; color: #7a7265; margin-top: 4px;
        }
        .person-stat strong { color: #1e1b16; }
        .person-stat .high { color: #dc2626; }

        /* ── Select ── */
        .select {
          appearance: none;
          background: rgba(246,241,232,0.6);
          border: 1px solid rgba(30,27,22,0.12);
          border-radius: 8px; padding: 6px 32px 6px 12px;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          color: #1e1b16; cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23555' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 12px;
        }
        .select:focus { outline: none; border-color: rgba(30,27,22,0.3); }

        /* ── Fun fact box ── */
        .funfact {
          margin-top: 48px;
          background: rgba(246,241,232,0.6);
          border: 1px solid rgba(30,27,22,0.08);
          border-radius: 10px; padding: 18px 22px; text-align: center;
          font-size: 13px; color: #7a7265;
        }
        .funfact strong { color: #1e1b16; }
        .funfact .red { color: #dc2626; }

        /* ── Footer ── */
        .footer {
          margin-top: 48px; padding-top: 24px;
          border-top: 1px solid rgba(30,27,22,0.08);
          text-align: center;
        }
        .footer p { font-size: 12px; color: #7a7265; }
        .footer .copy { font-size: 11px; color: #9a9189; margin-top: 4px; }

        /* ── Chart containers ── */
        .chart-container { width: 100%; }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .wrapper { padding: 20px 16px; }
          .header-title { font-size: 28px; }
          .section-title { font-size: 22px; }
          .card-value { font-size: 24px; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="wrapper">
        {/* ── Header ── */}
        <header className="header">
          <div className="header-row">
            <h1 className="header-title">💩 The Shit Tracker</h1>
            <p className="header-tagline">5 friends, 365 days, every visit counted</p>
          </div>
          <p className="header-privacy">
            No tracking · No cookies · Just data · Privacy-first, hosted on GitHub Pages
          </p>
        </header>

        {/* ── Progress ── */}
        <div className="progress-panel">
          <h3 className="progress-title">Data Collection Progress</h3>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-label">
            {totalDays} / 365 days ({progress}%) · {fmtDateLong(data[0].date)} → {fmtDateLong(data[data.length - 1].date)}
          </p>
        </div>

        {/* ── Navigation ── */}
        <div className="nav-row">
          <NavPill icon="📊" label="Overview" href="#overview" />
          <NavPill icon="📈" label="Cumulative" href="#cumulative" />
          <NavPill icon="🏆" label="Records" href="#records" />
          <NavPill icon="📅" label="Weekly" href="#weekly" />
          <NavPill icon="👤" label="Per Person" href="#per-person" />
        </div>

        {/* ── Featured stats ── */}
        <div className="stat-grid" style={{ marginBottom: 40 }}>
          <StatCard label="Total Visits" value={totalShits.toLocaleString()} unit="shits" badge="ONGOING" badgeColor="green" />
          <StatCard label="Daily Average" value={avgPerDay} unit="per day (group)" badge={+avgPerDay > 8 ? "HIGH" : "NORMAL"} badgeColor={+avgPerDay > 8 ? "amber" : "green"} />
          <StatCard label="Days Tracked" value={totalDays} unit="days" badge={`${progress}%`} badgeColor="blue" />
          <StatCard label="Champion" value={champion} unit={`${personTotal[champion]} total`} badge="👑 LEADER" badgeColor="amber" />
        </div>

        {/* ═══ DAILY OVERVIEW ═══ */}
        <Section id="overview" title="Daily Visits — Group Total" subtitle="Combined daily number of visits across all five participants.">
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#81b29a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#81b29a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Sum" stroke="#3d8b6e" strokeWidth={2} fill="url(#gradSum)" name="Group Total" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ═══ CUMULATIVE ═══ */}
        <Section id="cumulative" title="Cumulative Shits Over Time" subtitle="Running total for each person. Watch the race unfold.">
          <div className="chart-container" style={{ height: 340 }}>
            <ResponsiveContainer>
              <LineChart data={cumData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                {NAMES.map((n) => (
                  <Line key={n} type="monotone" dataKey={n} stroke={COLORS[n]} strokeWidth={2.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ═══ RECORDS ═══ */}
        <Section id="records" title="Personal Records" subtitle="Max visits in a single day, averages, and totals per person.">
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            {NAMES.map((n) => (
              <div key={n} className="person-card">
                <div className="person-header">
                  <div className="person-dot" style={{ background: COLORS[n] }} />
                  <span className="person-name">{n}</span>
                </div>
                <div className="person-stat">
                  <span>Avg/day</span>
                  <strong>{personAvg[n]}</strong>
                </div>
                <div className="person-stat">
                  <span>Max in a day</span>
                  <strong className={personMax[n] >= 4 ? "high" : ""}>{personMax[n]}</strong>
                </div>
                <div className="person-stat">
                  <span>Total</span>
                  <strong>{personTotal[n]}</strong>
                </div>
                <div className="person-stat">
                  <span>Zero days</span>
                  <strong>{zeroDays[n]}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="chart-container" style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={NAMES.map((n) => ({ name: n, max: personMax[n], avg: +personAvg[n] }))} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#1e1b16", fontWeight: 600 }} axisLine={{ stroke: "rgba(30,27,22,0.15)" }} />
                <YAxis {...yAxisProps} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                <Bar dataKey="max" name="Max in a Day" radius={[6, 6, 0, 0]} fill="#e07a5f" fillOpacity={0.75} />
                <Bar dataKey="avg" name="Daily Avg" radius={[6, 6, 0, 0]} fill="#81b29a" fillOpacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ═══ WEEKLY ═══ */}
        <Section id="weekly" title="Weekly Averages" subtitle="Average daily visits per week, stacked by person.">
          <div className="chart-container" style={{ height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#7a7265" }} axisLine={{ stroke: "rgba(30,27,22,0.15)" }} />
                <YAxis {...yAxisProps} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                {NAMES.map((n) => (
                  <Bar key={n} dataKey={n} stackId="a" fill={COLORS[n]} fillOpacity={0.8} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ═══ PER PERSON ═══ */}
        <Section id="per-person" title="Individual Daily Tracker">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#7a7265" }}>Person</span>
            <select className="select" value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
              <option value="all">All (Stacked)</option>
              {NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer>
              {selectedPerson === "all" ? (
                <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                  {NAMES.map((n) => (
                    <Area key={n} type="monotone" dataKey={n} stackId="1" stroke={COLORS[n]} fill={COLORS[n]} fillOpacity={0.5} />
                  ))}
                </AreaChart>
              ) : (
                <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...xAxisProps} />
                  <YAxis {...yAxisProps} domain={[0, 6]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey={selectedPerson} fill={COLORS[selectedPerson]} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ── Fun fact ── */}
        <div className="funfact">
          🚽 The busiest day so far was <strong>{fmtDate(maxDayDate)}</strong> with{" "}
          <strong className="red">{maxSingleDay}</strong> group visits.
          At current pace, the group is on track for <strong>{projected.toLocaleString()}</strong> shits in the year.
        </div>

        {/* ── Footer ── */}
        <footer className="footer">
          <p>No cookies · No analytics · Privacy-first · Hosted on GitHub Pages</p>
          <p className="copy">© 2026 The Shit Tracker. All bowel movements reserved.</p>
        </footer>
      </div>
    </>
  );
}
