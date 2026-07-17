"use client";

import {
  CSSProperties,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { PillarScore } from "@/app/data";
import { InsightPillarId } from "@/app/resultInsights";
import { Bilingual, bi, pick } from "@/app/i18n";
import { useLanguage } from "@/app/LanguageContext";

type NetworkMode = "preview" | "scored";
type Point = { x: number; y: number };
type NetworkPointId = InsightPillarId | "outcome";

interface NetworkNode {
  id: InsightPillarId;
  index: string;
  label: Bilingual;
  shortLabel: Bilingual;
  description: Bilingual;
  color: string;
  textColor: string;
  position: Point;
}

const NODES: NetworkNode[] = [
  {
    id: "estrategia",
    index: "01",
    label: bi("Estratégia", "Strategy"),
    shortLabel: bi("Estratégia", "Strategy"),
    description: bi(
      "Prioridade executiva, tese de valor e direção para o portfólio.",
      "Executive priority, value thesis, and direction for the portfolio."
    ),
    color: "#9c78e8",
    textColor: "#6b3cb1",
    position: { x: 50, y: 13 },
  },
  {
    id: "dados",
    index: "02",
    label: bi("Dados", "Data"),
    shortLabel: bi("Dados", "Data"),
    description: bi(
      "Qualidade, acesso, histórico e confiança para decisões e modelos.",
      "Quality, access, history, and trust for decisions and models."
    ),
    color: "#67c5a5",
    textColor: "#256b52",
    position: { x: 16, y: 38 },
  },
  {
    id: "governanca",
    index: "03",
    label: bi("Governança e Processo", "Governance and Process"),
    shortLabel: bi("Govern.", "Govern."),
    description: bi(
      "Responsabilidades, controles, segurança e operação responsável.",
      "Responsibilities, controls, security, and responsible operation."
    ),
    color: "#e1b35f",
    textColor: "#76500f",
    position: { x: 84, y: 38 },
  },
  {
    id: "pessoas",
    index: "04",
    label: bi("Pessoas e Cultura", "People and Culture"),
    shortLabel: bi("Pessoas", "People"),
    description: bi(
      "Capacidade interna, adoção e mudança na forma de trabalhar.",
      "In-house capacity, adoption, and changes to how work gets done."
    ),
    color: "#df8b91",
    textColor: "#93404a",
    position: { x: 23, y: 78 },
  },
  {
    id: "tecnologia",
    index: "05",
    label: bi("Tecnologia", "Technology"),
    shortLabel: bi("Tecnologia", "Technology"),
    description: bi(
      "Integração, produção, monitoramento e escala técnica.",
      "Integration, production, monitoring, and technical scale."
    ),
    color: "#8fa9bf",
    textColor: "#49677f",
    position: { x: 77, y: 78 },
  },
];

const CONNECTIONS: Array<[NetworkPointId, NetworkPointId]> = [
  ["estrategia", "outcome"],
  ["dados", "outcome"],
  ["governanca", "outcome"],
  ["pessoas", "outcome"],
  ["tecnologia", "outcome"],
  ["estrategia", "dados"],
  ["estrategia", "pessoas"],
  ["governanca", "dados"],
  ["governanca", "tecnologia"],
  ["dados", "tecnologia"],
  ["pessoas", "tecnologia"],
];

const OUTCOME_POSITION = { x: 50, y: 52 };

function DraggableNode({
  node,
  active,
  score,
  containerRef,
  disabled,
  onActivate,
  onMove,
  lang,
}: {
  node: NetworkNode;
  active: boolean;
  score?: number;
  containerRef: RefObject<HTMLDivElement | null>;
  disabled: boolean;
  onActivate: () => void;
  onMove: (point: Point) => void;
  lang: "pt" | "en";
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useMotionValueEvent(x, "change", latest => onMove({ x: latest, y: y.get() }));
  useMotionValueEvent(y, "change", latest => onMove({ x: x.get(), y: latest }));

  const style = {
    left: `${node.position.x}%`,
    top: `${node.position.y}%`,
    x,
    y,
    "--node-accent": node.color,
    "--node-text": node.textColor,
  } as unknown as CSSProperties;

  return (
    <motion.button
      type="button"
      className={`readiness-node${active ? " is-active" : ""}`}
      style={style}
      drag={!disabled}
      dragConstraints={containerRef}
      dragElastic={0.04}
      dragMomentum={false}
      onPointerDown={onActivate}
      onFocus={onActivate}
      onMouseEnter={onActivate}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      aria-pressed={active}
    >
      <span className="readiness-node-index">{node.index}</span>
      <span className="readiness-node-copy">
        <strong>{pick(node.shortLabel, lang)}</strong>
        {score !== undefined && <small>{score}%</small>}
      </span>
    </motion.button>
  );
}

export function ReadinessNetwork({
  mode,
  scores,
  activePillarId,
  onActivePillarChange,
  className = "",
}: {
  mode: NetworkMode;
  scores?: PillarScore[];
  activePillarId?: string;
  onActivePillarChange?: (pillar: InsightPillarId) => void;
  className?: string;
}) {
  const { lang } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [offsets, setOffsets] = useState<Record<InsightPillarId, Point>>({
    dados: { x: 0, y: 0 },
    estrategia: { x: 0, y: 0 },
    pessoas: { x: 0, y: 0 },
    governanca: { x: 0, y: 0 },
    tecnologia: { x: 0, y: 0 },
  });
  const [localActive, setLocalActive] = useState<InsightPillarId>("estrategia");
  const lastInteraction = useRef(0);
  const active = (activePillarId as InsightPillarId | undefined) ?? localActive;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mode !== "preview" || prefersReducedMotion || activePillarId) return;
    const timer = window.setInterval(() => {
      if (Date.now() - lastInteraction.current < 6500) return;
      setLocalActive(current => {
        const index = NODES.findIndex(node => node.id === current);
        return NODES[(index + 1) % NODES.length].id;
      });
    }, 3600);
    return () => window.clearInterval(timer);
  }, [activePillarId, mode, prefersReducedMotion]);

  const scoreById = useMemo(
    () => Object.fromEntries((scores ?? []).map(item => [item.id, item.score])) as Partial<Record<InsightPillarId, number>>,
    [scores]
  );

  const activate = useCallback((pillar: InsightPillarId) => {
    lastInteraction.current = Date.now();
    setLocalActive(pillar);
    onActivePillarChange?.(pillar);
  }, [onActivePillarChange]);

  const updateOffset = useCallback((pillar: InsightPillarId, point: Point) => {
    setOffsets(current => ({ ...current, [pillar]: point }));
  }, []);

  const pointFor = useCallback((id: NetworkPointId): Point => {
    const base = id === "outcome"
      ? OUTCOME_POSITION
      : NODES.find(node => node.id === id)?.position ?? OUTCOME_POSITION;
    const offset = id === "outcome" ? { x: 0, y: 0 } : offsets[id];
    return {
      x: size.width * base.x / 100 + offset.x,
      y: size.height * base.y / 100 + offset.y,
    };
  }, [offsets, size.height, size.width]);

  const activeNode = NODES.find(node => node.id === active) ?? NODES[0];

  return (
    <div className={`readiness-network readiness-network-${mode} ${className}`.trim()}>
      <div className="readiness-network-stage" ref={containerRef}>
        <svg className="readiness-network-lines" viewBox={`0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`} aria-hidden="true">
          {size.width > 0 && CONNECTIONS.map(([from, to], index) => {
            const start = pointFor(from);
            const end = pointFor(to);
            const touchesActive = from === active || to === active;
            const fromScore = from === "outcome" ? 100 : scoreById[from];
            const toScore = to === "outcome" ? 100 : scoreById[to];
            const critical = mode === "scored" && ((fromScore ?? 100) < 40 || (toScore ?? 100) < 40);
            const sourceNode = from === "outcome" ? activeNode : NODES.find(node => node.id === from) ?? activeNode;
            return (
              <g key={`${from}-${to}`} className={`${touchesActive ? "is-active" : ""}${critical ? " is-critical" : ""}`}>
                <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
                {!prefersReducedMotion && (
                  <motion.circle
                    r={touchesActive ? 2.7 : 2}
                    cx={start.x}
                    cy={start.y}
                    fill={critical ? "#df8b91" : sourceNode.color}
                    initial={{ cx: start.x, cy: start.y, opacity: 0 }}
                    animate={{ cx: [start.x, end.x], cy: [start.y, end.y], opacity: [0, touchesActive ? 1 : 0.55, 0] }}
                    transition={{ duration: 3.4 + index * 0.12, delay: index * 0.23, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        <div className="readiness-core" style={{ left: `${OUTCOME_POSITION.x}%`, top: `${OUTCOME_POSITION.y}%` }}>
          <span>{lang === "en" ? "AI" : "IA"}</span>
          <small>{lang === "en" ? "in operation" : "em operação"}</small>
        </div>

        {NODES.map(node => (
          <DraggableNode
            key={node.id}
            node={node}
            active={node.id === active}
            score={mode === "scored" ? scoreById[node.id] ?? 0 : undefined}
            containerRef={containerRef}
            disabled={Boolean(prefersReducedMotion)}
            onActivate={() => activate(node.id)}
            onMove={point => updateOffset(node.id, point)}
            lang={lang}
          />
        ))}
      </div>

      <div className="readiness-network-readout" aria-live="polite">
        <span style={{ color: mode === "scored" ? activeNode.textColor : activeNode.color }}>{activeNode.index}</span>
        <div>
          <strong>{pick(activeNode.label, lang)}</strong>
          <p>{pick(activeNode.description, lang)}</p>
        </div>
        {mode === "scored" && <b style={{ color: activeNode.textColor }}>{scoreById[activeNode.id] ?? 0}%</b>}
      </div>
    </div>
  );
}
