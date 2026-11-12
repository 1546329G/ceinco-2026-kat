// Fechas clínicas sin corrimiento de zona horaria.
// `new Date('1988-12-21')` se interpreta en UTC y en Lima (UTC-5) se muestra el día anterior,
// por eso las fechas "solo día" se leen como fecha local.

const soloDia = /^(\d{4})-(\d{2})-(\d{2})$/;

export function aFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const texto = valor.slice(0, 10);
  const m = soloDia.exec(texto);
  if (m && valor.length <= 10) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function formatoFecha(valor: string | null | undefined, opciones: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }): string {
  const fecha = aFecha(valor);
  return fecha ? fecha.toLocaleDateString('es-PE', opciones) : '—';
}

export function formatoFechaLarga(valor: string | null | undefined): string {
  return formatoFecha(valor, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function edad(valor: string | null | undefined): number | null {
  const nacimiento = aFecha(valor);
  if (!nacimiento) return null;
  const hoy = new Date();
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) anios--;
  return anios;
}
