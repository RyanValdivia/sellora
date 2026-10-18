/**
 * Inicio del día calendario de `now` en la zona horaria dada (p. ej. "America/Lima"), como instante UTC.
 * Sirve para contar "sellos de hoy" según el día del negocio y no el del servidor.
 */
export function startOfDayInZone(now: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  // Segundos transcurridos desde la medianoche local; restarlos da la medianoche local en UTC.
  const sinceMidnightMs = ((get("hour") * 60 + get("minute")) * 60 + get("second")) * 1000;
  return new Date(now.getTime() - sinceMidnightMs - now.getMilliseconds());
}
