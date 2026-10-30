import { SITIO } from "./sitio";

const zona = SITIO.zonaHoraria;

/** AAAA-MM-DD de un instante, en la hora de Monterrey. */
export function fechaLocal(instante: Date | string | number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(instante),
  );
}

/** Mediodía de una fecha AAAA-MM-DD (para formatear sin que la zona horaria cambie el día). */
function aFecha(fecha: string) {
  return new Date(`${fecha}T12:00:00-06:00`);
}

export function fechaLarga(fecha: string) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: zona, weekday: "long", day: "numeric", month: "long" }).format(
    aFecha(fecha),
  );
}

export function fechaCorta(fecha: string) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: zona, day: "numeric", month: "short" })
    .format(aFecha(fecha))
    .replace(".", "");
}

export function diaSemana(fecha: string) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: zona, weekday: "short" }).format(aFecha(fecha)).replace(".", "");
}

export function sumarDias(fecha: string, dias: number) {
  const d = aFecha(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return fechaLocal(d);
}
