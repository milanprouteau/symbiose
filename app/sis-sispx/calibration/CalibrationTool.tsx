"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

const PAGE_SIZE = 50;
import {
  DEFAULT_CONFIG, computeScores,
  type PlayerIntermediate, type ThresholdConfig, type TH, type PosGroup,
} from "./engine";
import styles from "./page.module.scss";

// ── Sub-components ────────────────────────────────────────

function ThRow({
  label, path, cfg, onChange, step = 0.1, unit = "",
}: {
  label: string;
  path: string;
  cfg: ThresholdConfig;
  onChange: (path: string, field: "worse" | "better" | "pts", val: number) => void;
  step?: number;
  unit?: string;
}) {
  const th = getPath(cfg, path) as TH;
  return (
    <tr className={styles.thRow}>
      <td className={styles.thLabel}>{label}{unit && <span className={styles.unit}>{unit}</span>}</td>
      <td>
        <input
          type="number" step={step} value={th.worse}
          onChange={(e) => onChange(path, "worse", parseFloat(e.target.value))}
          className={styles.thInput}
        />
      </td>
      <td className={styles.arrow}>→</td>
      <td>
        <input
          type="number" step={step} value={th.better}
          onChange={(e) => onChange(path, "better", parseFloat(e.target.value))}
          className={styles.thInput}
        />
      </td>
      <td>
        <input
          type="number" step={0.5} min={0} value={th.pts}
          onChange={(e) => onChange(path, "pts", parseFloat(e.target.value))}
          className={`${styles.thInput} ${styles.ptsInput}`}
        />
      </td>
    </tr>
  );
}

function DefTable({
  cfg, onChange,
}: {
  cfg: ThresholdConfig;
  onChange: (path: string, field: "worse" | "better" | "pts", val: number) => void;
}) {
  const groups: PosGroup[] = ["G", "WING", "BIG"];
  const stats: { key: "wsDef" | "stl" | "blk" | "drb"; label: string; step: number }[] = [
    { key: "wsDef", label: "WS.def/40×100", step: 0.5 },
    { key: "stl",   label: "STL/40",        step: 0.1 },
    { key: "blk",   label: "BLK/40",        step: 0.1 },
    { key: "drb",   label: "DefReb%",       step: 1   },
  ];

  return (
    <table className={styles.defTable}>
      <thead>
        <tr>
          <th className={styles.defStat}>Stat</th>
          {groups.map((g) => (
            <th key={g} className={styles.defGroup} colSpan={3}>{g}</th>
          ))}
        </tr>
        <tr>
          <th />
          {groups.flatMap((g) => [
            <th key={`${g}-w`} className={styles.defHdr}>worse</th>,
            <th key={`${g}-b`} className={styles.defHdr}>better</th>,
            <th key={`${g}-p`} className={styles.defHdr}>pts</th>,
          ])}
        </tr>
      </thead>
      <tbody>
        {stats.map((s) => (
          <tr key={s.key} className={styles.thRow}>
            <td className={styles.thLabel}>{s.label}</td>
            {groups.flatMap((g) => {
              const th = cfg.def[g][s.key];
              const pfx = `def.${g}.${s.key}`;
              return [
                <td key={`${g}-w`}>
                  <input type="number" step={s.step} value={th.worse}
                    onChange={(e) => onChange(pfx, "worse", parseFloat(e.target.value))}
                    className={styles.thInput} />
                </td>,
                <td key={`${g}-b`}>
                  <input type="number" step={s.step} value={th.better}
                    onChange={(e) => onChange(pfx, "better", parseFloat(e.target.value))}
                    className={styles.thInput} />
                </td>,
                <td key={`${g}-p`}>
                  <input type="number" step={0.5} min={0} value={th.pts}
                    onChange={(e) => onChange(pfx, "pts", parseFloat(e.target.value))}
                    className={`${styles.thInput} ${styles.ptsInput}`} />
                </td>,
              ];
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Section({
  title, pts, children,
}: {
  title: string; pts: number; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen((o) => !o)}>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.sectionPts}>{pts} pts</span>
        <span className={styles.sectionChevron}>{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

// ── Path helpers ─────────────────────────────────────────

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((o: unknown, k) => (o as Record<string, unknown>)?.[k], obj);
}

function setPath(obj: ThresholdConfig, path: string, field: "worse" | "better" | "pts", val: number): ThresholdConfig {
  const keys = path.split(".");
  const clone = structuredClone(obj);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = clone;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
  cur[keys[keys.length - 1]][field] = val;
  return clone;
}

function sectionPts(cfg: ThresholdConfig, keys: string[]): number {
  return Math.round(keys.reduce((s, k) => s + (getPath(cfg, k) as TH).pts, 0) * 10) / 10;
}

function defPts(cfg: ThresholdConfig): number {
  let s = 0;
  for (const g of ["G", "WING", "BIG"] as PosGroup[]) {
    for (const k of ["wsDef", "stl", "blk", "drb"] as const) {
      s += cfg.def[g][k].pts;
    }
  }
  return Math.round(s / 3 * 10) / 10; // avg across posGroups
}

// ── Score color ──────────────────────────────────────────

function scoreColor(val: number): string {
  if (val >= 70) return "var(--color-secondary-green)";
  if (val >= 60) return "var(--color-primary-yellow)";
  if (val >= 50) return "var(--color-primary-white)";
  return "var(--color-secondary-beige)";
}

// ── Main component ────────────────────────────────────────

export default function CalibrationTool({ players }: { players: PlayerIntermediate[] }) {
  const [cfg, setCfg] = useState<ThresholdConfig>(DEFAULT_CONFIG);
  const [sortKey, setSortKey] = useState<"sis" | "sisPx" | "pick">("sisPx");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [yearFilter, setYearFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const handleChange = useCallback(
    (path: string, field: "worse" | "better" | "pts", val: number) => {
      if (isNaN(val)) return;
      setCfg((prev) => setPath(prev, path, field, val));
    },
    [],
  );

  const scores = useMemo(
    () => players.map((p) => ({ player: p, scores: computeScores(p, cfg) })),
    [players, cfg],
  );

  const defaultScores = useMemo(
    () => players.map((p) => ({ id: p.id, year: p.year, scores: computeScores(p, DEFAULT_CONFIG) })),
    [players],
  );

  const defaultMap = useMemo(() => {
    const m = new Map<string, { sis: number; sisPx: number }>();
    for (const d of defaultScores) {
      m.set(`${d.id}-${d.year}`, { sis: d.scores.sis.total, sisPx: d.scores.sisPx.total });
    }
    return m;
  }, [defaultScores]);

  // Tier averages
  const tierStats = useMemo(() => {
    const lottery = scores.filter((s) => s.player.overall != null && s.player.overall <= 14);
    const mid     = scores.filter((s) => s.player.overall != null && s.player.overall >= 15 && s.player.overall <= 30);
    const second  = scores.filter((s) => s.player.overall != null && s.player.overall > 30);
    const prospects = scores.filter((s) => s.player.year === null);
    const avg = (arr: typeof scores, key: "sis" | "sisPx") =>
      arr.length ? (arr.reduce((s, p) => s + p.scores[key].total, 0) / arr.length).toFixed(1) : "—";
    return { lottery, mid, second, prospects, avg };
  }, [scores]);

  const years = useMemo(() => {
    const s = new Set(players.map((p) => p.year ?? 2026));
    return Array.from(s).sort((a, b) => b - a);
  }, [players]);

  const filtered = useMemo(() => {
    return scores.filter((s) => {
      const q = search.toLowerCase();
      if (q && !s.player.name.toLowerCase().includes(q) && !s.player.team.toLowerCase().includes(q)) return false;
      if (yearFilter !== "all" && String(s.player.year ?? 2026) !== yearFilter) return false;
      return true;
    });
  }, [scores, search, yearFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === "pick") {
        av = a.player.overall ?? 999;
        bv = b.player.overall ?? 999;
      } else {
        av = a.scores[sortKey].total;
        bv = b.scores[sortKey].total;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortDir]);

  useEffect(() => { setPage(0); }, [search, yearFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Calibration SIS / SIS-Px</h1>
          <p className={styles.subtitle}>
            {players.filter((p) => p.year === null).length} prospects 2026 ·{" "}
            {players.filter((p) => p.year !== null).length} draftés 2005–2025
          </p>
        </div>
        <div className={styles.headerLinks}>
          <a href="/sis-sispx" className={styles.backLink}>← Tableau global</a>
          <button className={styles.resetBtn} onClick={() => setCfg(DEFAULT_CONFIG)}>
            Reset Option A
          </button>
        </div>
      </header>

      {/* Tier summary */}
      <div className={styles.tierBar}>
        {[
          { label: "Lottery #1–14",  data: tierStats.lottery },
          { label: "Mid 1st #15–30", data: tierStats.mid },
          { label: "2nd round #31+", data: tierStats.second },
          { label: "Prospects 2026", data: tierStats.prospects },
        ].map(({ label, data }) => (
          <div key={label} className={styles.tierCard}>
            <div className={styles.tierLabel}>{label}</div>
            <div className={styles.tierValues}>
              <span>SIS <strong style={{ color: scoreColor(parseFloat(tierStats.avg(data, "sis"))) }}>
                {tierStats.avg(data, "sis")}
              </strong></span>
              <span>SIS-Px <strong style={{ color: scoreColor(parseFloat(tierStats.avg(data, "sisPx"))) }}>
                {tierStats.avg(data, "sisPx")}
              </strong></span>
            </div>
            <div className={styles.tierN}>n={data.length}</div>
          </div>
        ))}
      </div>

      <div className={styles.layout}>
        {/* ── Left panel ── */}
        <aside className={styles.panel}>
          <div className={styles.panelScroll}>
            <div className={styles.panelTitle}>
              <span>SIS</span>
              <span className={styles.panelHint}>worse → better · pts</span>
            </div>

            <Section title="1. Offensive Efficiency" pts={sectionPts(cfg, ["sis_ts", "sis_ppp", "sis_to"])}>
              <table className={styles.thTable}>
                <tbody>
                  <ThRow label="TS%"      path="sis_ts"  cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="PPP"      path="sis_ppp" cfg={cfg} onChange={handleChange} step={0.05} />
                  <ThRow label="TO Rate"  path="sis_to"  cfg={cfg} onChange={handleChange} step={0.01} />
                </tbody>
              </table>
            </Section>

            <Section title="2. Defensive Impact" pts={defPts(cfg)}>
              <DefTable cfg={cfg} onChange={handleChange} />
            </Section>

            <Section title="3. Advanced Efficiency" pts={sectionPts(cfg, ["sis_porpag", "sis_efg", "sis_astTo"])}>
              <table className={styles.thTable}>
                <tbody>
                  <ThRow label="PORPAG"  path="sis_porpag" cfg={cfg} onChange={handleChange} step={0.1} />
                  <ThRow label="eFG%"    path="sis_efg"    cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="AST/TO"  path="sis_astTo"  cfg={cfg} onChange={handleChange} step={0.1} />
                </tbody>
              </table>
            </Section>

            <Section title="4. Hustle" pts={sectionPts(cfg, ["sis_reb", "sis_fouls"])}>
              <table className={styles.thTable}>
                <tbody>
                  <ThRow label="Reb/40"    path="sis_reb"   cfg={cfg} onChange={handleChange} step={0.5} />
                  <ThRow label="Fouls/40"  path="sis_fouls" cfg={cfg} onChange={handleChange} step={0.1} />
                </tbody>
              </table>
            </Section>

            <Section title="5. System Weight" pts={sectionPts(cfg, ["sis_usage", "sis_ast", "sis_minPct"])}>
              <table className={styles.thTable}>
                <tbody>
                  <ThRow label="Usage%"     path="sis_usage"  cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="Assist Rate" path="sis_ast"   cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="Min%"        path="sis_minPct" cfg={cfg} onChange={handleChange} unit="%" />
                </tbody>
              </table>
            </Section>

            <div className={styles.panelTitle} style={{ marginTop: "1.5rem" }}>
              <span>SIS-Px</span>
            </div>

            <Section title="1. Physical" pts={sectionPts(cfg, ["px_heightDelta", "px_fouls", "px_stlBlk"])}>
              <table className={styles.thTable}>
                <tbody>
                  <ThRow label="Δ Height"   path="px_heightDelta" cfg={cfg} onChange={handleChange} step={0.5} unit=" in" />
                  <ThRow label="Fouls/40"   path="px_fouls"       cfg={cfg} onChange={handleChange} step={0.1} />
                  <ThRow label="STL+BLK/40" path="px_stlBlk"      cfg={cfg} onChange={handleChange} step={0.1} />
                </tbody>
              </table>
            </Section>

            <Section title="2. Efficiency" pts={sectionPts(cfg, ["px_ts", "px_ppp", "px_astTo", "px_ft", "px_3par"])}>
              <table className={styles.thTable}>
                <tbody>
                  <ThRow label="TS%"     path="px_ts"    cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="PPP"     path="px_ppp"   cfg={cfg} onChange={handleChange} step={0.05} />
                  <ThRow label="AST/TO"  path="px_astTo" cfg={cfg} onChange={handleChange} step={0.1} />
                  <ThRow label="FT%"     path="px_ft"    cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="3PAr"    path="px_3par"  cfg={cfg} onChange={handleChange} unit="%" />
                </tbody>
              </table>
            </Section>

            <Section title="3. Defensive Mobility" pts={sectionPts(cfg, ["px_defFouls"])}>
              <p className={styles.note}>STL/40 et BLK/40 héritent des seuils Défensif × 1.1</p>
              <table className={styles.thTable}>
                <tbody>
                  <ThRow label="Fouls/40" path="px_defFouls" cfg={cfg} onChange={handleChange} step={0.1} />
                </tbody>
              </table>
            </Section>

            <Section title="4. Projected Role" pts={sectionPts(cfg, ["px_usage", "px_ast", "px_por"])}>
              <table className={styles.thTable}>
                <tbody>
                  <ThRow label="Usage%"     path="px_usage" cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="Assist Rate" path="px_ast"  cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="PORPAG"      path="px_por"  cfg={cfg} onChange={handleChange} step={0.1} />
                </tbody>
              </table>
            </Section>

            <Section title="5. NBA Adaptability" pts={sectionPts(cfg, ["px_rimAttack", "px_spacing", "px_ftRate", "px_efg"])}>
              <table className={styles.thTable}>
                <tbody>
                  <ThRow label="Rim Attack" path="px_rimAttack" cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="3PAr"        path="px_spacing"  cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="FT Rate"     path="px_ftRate"   cfg={cfg} onChange={handleChange} unit="%" />
                  <ThRow label="eFG%"        path="px_efg"      cfg={cfg} onChange={handleChange} unit="%" />
                </tbody>
              </table>
            </Section>
          </div>
        </aside>

        {/* ── Right: table ── */}
        <div className={styles.tableWrap}>
          <div className={styles.controls}>
            <input
              className={styles.search}
              type="text" placeholder="Rechercher..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={styles.yearSelect}
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">Toutes les années</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  {y === 2026 ? "2026 (prospects)" : y}
                </option>
              ))}
            </select>
            <span className={styles.count}>{sorted.length} joueurs</span>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>#</th>
                <th className={styles.th}>Joueur</th>
                <th className={styles.th}>Année</th>
                <th className={`${styles.th} ${styles.num}`}
                  onClick={() => { setSortKey("pick"); setSortDir((d) => sortKey === "pick" ? (d === "asc" ? "desc" : "asc") : "asc"); }}>
                  Pick {sortKey === "pick" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className={styles.th}>Pos</th>
                <th className={`${styles.th} ${styles.num}`}
                  onClick={() => { setSortKey("sis"); setSortDir((d) => sortKey === "sis" ? (d === "asc" ? "desc" : "asc") : "desc"); }}>
                  SIS {sortKey === "sis" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className={`${styles.th} ${styles.num}`}>
                  <span className={styles.subScore}>Off</span>
                  <span className={styles.subScore}>Déf</span>
                  <span className={styles.subScore}>Adv</span>
                  <span className={styles.subScore}>Hus</span>
                  <span className={styles.subScore}>Sys</span>
                </th>
                <th className={`${styles.th} ${styles.num} ${styles.pxCol}`}
                  onClick={() => { setSortKey("sisPx"); setSortDir((d) => sortKey === "sisPx" ? (d === "asc" ? "desc" : "asc") : "desc"); }}>
                  SIS-Px {sortKey === "sisPx" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className={`${styles.th} ${styles.num}`}>
                  <span className={styles.subScore}>Phy</span>
                  <span className={styles.subScore}>Eff</span>
                  <span className={styles.subScore}>Déf</span>
                  <span className={styles.subScore}>Rôle</span>
                  <span className={styles.subScore}>NBA</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ player: p, scores: s }, idx) => {
                const key = `${p.id}-${p.year}`;
                const globalIdx = page * PAGE_SIZE + idx;
                const orig = defaultMap.get(key);
                const sisDelta = orig ? s.sis.total - orig.sis : 0;
                const pxDelta  = orig ? s.sisPx.total - orig.sisPx : 0;
                return (
                  <tr key={key} className={styles.row}>
                    <td className={`${styles.td} ${styles.rank}`}>{globalIdx + 1}</td>
                    <td className={styles.name}>
                      {p.name}
                      {p.year === null && <span className={styles.prospectBadge}>★</span>}
                    </td>
                    <td className={`${styles.td} ${styles.yearCell}`}>
                      {p.year ?? <span className={styles.prospect2026}>2026</span>}
                    </td>
                    <td className={`${styles.td} ${styles.num}`}>
                      {p.overall != null ? `#${p.overall}` : "—"}
                    </td>
                    <td className={`${styles.td} ${styles.pos}`}>{p.posGroup}</td>
                    <td className={`${styles.td} ${styles.num} ${styles.scoreCell}`}
                      style={{ color: scoreColor(s.sis.total) }}>
                      {s.sis.total.toFixed(1)}
                      {orig && Math.abs(sisDelta) >= 0.1 && (
                        <span className={sisDelta > 0 ? styles.deltaPos : styles.deltaNeg}>
                          {sisDelta > 0 ? "+" : ""}{sisDelta.toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.num} ${styles.subCells}`}>
                      <span className={styles.sub}>{s.sis.offensiveEfficiency.toFixed(1)}</span>
                      <span className={styles.sub}>{s.sis.defensiveImpact.toFixed(1)}</span>
                      <span className={styles.sub}>{s.sis.advancedEfficiency.toFixed(1)}</span>
                      <span className={styles.sub}>{s.sis.hustle.toFixed(1)}</span>
                      <span className={styles.sub}>{s.sis.systemWeight.toFixed(1)}</span>
                    </td>
                    <td className={`${styles.td} ${styles.num} ${styles.scoreCell} ${styles.pxCol}`}
                      style={{ color: scoreColor(s.sisPx.total) }}>
                      {s.sisPx.total.toFixed(1)}
                      {orig && Math.abs(pxDelta) >= 0.1 && (
                        <span className={pxDelta > 0 ? styles.deltaPos : styles.deltaNeg}>
                          {pxDelta > 0 ? "+" : ""}{pxDelta.toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.num} ${styles.subCells}`}>
                      <span className={styles.sub}>{s.sisPx.pxPhysical.toFixed(1)}</span>
                      <span className={styles.sub}>{s.sisPx.pxEfficiency.toFixed(1)}</span>
                      <span className={styles.sub}>{s.sisPx.pxDefensiveMobility.toFixed(1)}</span>
                      <span className={styles.sub}>{s.sisPx.pxProjectedRole.toFixed(1)}</span>
                      <span className={styles.sub}>{s.sisPx.pxNBAAdaptability.toFixed(1)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ←
              </button>
              <span className={styles.pageInfo}>
                {page + 1} / {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
