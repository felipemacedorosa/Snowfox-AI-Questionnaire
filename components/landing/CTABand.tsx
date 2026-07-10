"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { fadeUp, staggerChildren } from "@/lib/motion";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The one sanctioned centered moment — sits directly on the backdrop, no card. */
export function CTABand({ onStart }: { onStart: () => void }) {
  return (
    <motion.section
      className="py-36 max-lg:py-24 flex flex-col items-center text-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-120px" }}
      variants={staggerChildren(0.1)}
    >
      <motion.h2
        variants={fadeUp}
        className="font-display font-black text-white max-w-[640px] text-[clamp(30px,4.5vw,40px)] leading-[1.15] tracking-[-0.025em]"
      >
        Descubra onde sua empresa está. E o que fazer a seguir.
      </motion.h2>

      <motion.div variants={fadeUp} className="mt-10">
        <Magnetic>
          <Button onClick={onStart}>
            Iniciar avaliação gratuita
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Button>
        </Magnetic>
      </motion.div>

      <motion.p variants={fadeUp} className="mt-5 text-[13px] text-[var(--text-dim)]">
        Gratuito · Sem cadastro · Resultado na hora
      </motion.p>

      <motion.footer
        variants={fadeUp}
        className="mt-24 w-full flex flex-col items-center gap-4 pt-9"
        style={{ borderTop: "1px solid var(--line-1)" }}
      >
        <Image src={`${BASE}/logo-dark.png`} alt="Snowfox AI" width={104} height={24} style={{ height: 24, width: "auto" }} />
        <p className="text-[12px] tracking-[0.06em] text-[var(--text-p)]">
          SnowFox AI · snowfox-ai.com
        </p>
      </motion.footer>
    </motion.section>
  );
}
