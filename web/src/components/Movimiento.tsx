"use client";

import { MotionConfig, motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Respeta "reducir movimiento" del sistema en todo el sitio. */
export function ProveedorMovimiento({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const subir: Variants = {
  oculto: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

/** Aparece al entrar en pantalla. */
export function Revelar({ children, className, retraso = 0 }: { children: ReactNode; className?: string; retraso?: number }) {
  return (
    <motion.div
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={subir}
      transition={{ delay: retraso }}
    >
      {children}
    </motion.div>
  );
}

/** Contenedor cuyos hijos <RevelarHijo> entran en secuencia. */
export function Escalonado({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ol" | "ul" }) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
    >
      {children}
    </Comp>
  );
}

export function RevelarHijo({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" | "article" }) {
  const Comp = motion[as];
  return (
    <Comp className={className} variants={subir}>
      {children}
    </Comp>
  );
}

/** Entrada del hero: líneas que suben una tras otra al cargar. */
export function EntradaHero({ children }: { children: ReactNode }) {
  return (
    <motion.div initial="oculto" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } }}>
      {children}
    </motion.div>
  );
}

export function LineaHero({ children }: { children: ReactNode }) {
  return <motion.div variants={subir}>{children}</motion.div>;
}
