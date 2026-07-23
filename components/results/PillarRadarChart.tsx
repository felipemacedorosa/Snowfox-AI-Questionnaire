"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PillarScore } from "@/app/data";
import { useLanguage } from "@/app/LanguageContext";

// Mirrors the accent colors used per pillar in ReadinessNetwork.tsx so the
// radar overview reads as the same visual language as the rest of the report.
const PILLAR_ACCENT: Record<string, string> = {
  estrategia: "#6b3cb1",
  dados: "#256b52",
  governanca: "#76500f",
  pessoas: "#93404a",
  tecnologia: "#49677f",
};

export function PillarRadarChart({ pillarScores }: { pillarScores: PillarScore[] }) {
  const { t } = useLanguage();
  const data = pillarScores.map(pillar => ({ id: pillar.id, pillar: pillar.title, score: pillar.score }));
  const colorByLabel = Object.fromEntries(
    pillarScores.map(pillar => [pillar.title, PILLAR_ACCENT[pillar.id] ?? "#7b4ed2"])
  );

  return (
    <div className="pillar-radar-chart">
      <ResponsiveContainer width="100%" height={380}>
        <RadarChart data={data} outerRadius="55%" margin={{ top: 24, right: 65, bottom: 24, left: 135 }}>
          <PolarGrid stroke="#dedcd5" />
          <PolarAngleAxis
            dataKey="pillar"
            tick={props => {
              const { x, y, payload, textAnchor } = props;
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  fill={colorByLabel[payload.value] ?? "#676862"}
                  fontSize={10}
                  fontWeight={600}
                  fontFamily="Montserrat, sans-serif"
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={t.chart.score}
            dataKey="score"
            stroke="#7b4ed2"
            fill="#7b4ed2"
            fillOpacity={0.22}
            strokeWidth={2}
            dot={props => {
              const { cx, cy, index, payload } = props;
              return (
                <circle
                  key={`radar-dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={colorByLabel[payload.pillar] ?? "#7b4ed2"}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              );
            }}
          />
          <Tooltip
            formatter={value => [`${value}%`, t.chart.score]}
            contentStyle={{
              background: "#fff",
              border: "1px solid #dedcd5",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "Montserrat, sans-serif",
              color: "#1a1b1c",
              padding: "6px 10px",
            }}
            labelStyle={{ color: "#1a1b1c", fontWeight: 600, marginBottom: 2 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
