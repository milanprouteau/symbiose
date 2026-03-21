import type { PlayerDataBundle } from "@/types/stats";

type Props = { stats: PlayerDataBundle };

export default function PlayerHero({ stats }: Props) {
  const p = stats.playerStats;
  const s = stats.shootingStats;
  const games = p.games || 1;

  const ppg = (p.points / games).toFixed(1);
  const rpg = (p.rebounds.total / games).toFixed(1);
  const apg = (p.assists / games).toFixed(1);
  const mpg = (p.minutes / games).toFixed(1);

  const overview = [
    `${p.position} · ${p.team} (${p.conference}) — ${p.games} matchs, ${p.starts} titulaire.`,
    `${ppg} PPG, ${rpg} RPG, ${apg} APG en ${mpg} MPG.`,
    `Shooting: ${p.fieldGoals.pct}% FG, ${p.threePointFieldGoals.pct}% 3PT, ${p.freeThrows.pct}% FT.`,
    `TS% ${(p.trueShootingPct * 100).toFixed(1)}% · Usage ${p.usage}% · Net Rating +${p.netRating}.`,
  ];

  return (
    <section className="w-full border-b border-(--color-border) bg-(--color-surface)">
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-10 items-start">

        {/* Infos principales */}
        <div className="flex-1 min-w-0">
          {/* Nom + badges */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1 className="font-display text-3xl text-primary-orange leading-none">
              {p.name}
            </h1>
            <span className="font-heading text-sm text-primary-white uppercase tracking-widest">
              {p.position} · {p.team}
            </span>
          </div>

          {/* Métadonnées */}
          <div className="mt-1 flex gap-4 font-heading text-xs text-primary-white">
            <span>{p.conference}</span>
            <span>·</span>
            <span>{p.games}G / {p.starts}GS</span>
            <span>·</span>
            <span>Season {p.seasonLabel}</span>
          </div>

          {/* Stats clés */}
          <div className="mt-5 flex gap-6">
            {[
              { label: "PPG", value: ppg },
              { label: "RPG", value: rpg },
              { label: "APG", value: apg },
              { label: "MPG", value: mpg },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="font-display text-2xl text-primary-yellow leading-none">
                  {stat.value}
                </span>
                <span className="font-heading text-[10px] text-primary-white uppercase tracking-widest mt-1">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shooting splits */}
        <div className="shrink-0 flex gap-4">
          {[
            { label: "FG%", value: p.fieldGoals.pct },
            { label: "3PT%", value: p.threePointFieldGoals.pct },
            { label: "FT%", value: p.freeThrows.pct },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="font-display text-xl text-primary-yellow leading-none">
                {stat.value}
              </span>
              <span className="font-heading text-[10px] text-primary-white uppercase tracking-widest mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Overview */}
        <div className="hidden lg:block w-80 shrink-0 border-l border-(--color-border) pl-8">
          <h2 className="font-heading text-xs uppercase tracking-widest text-primary-white mb-3">
            Aperçu
          </h2>
          <ul className="space-y-2">
            {overview.map((line, i) => (
              <li
                key={i}
                className="font-heading text-xs text-primary-white leading-relaxed flex gap-2"
              >
                <span className="text-primary-orange mt-0.5">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
}