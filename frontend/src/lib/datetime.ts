/** Fuso IANA do browser (ex.: Europe/Lisbon). */
export function getClientTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Data local do utilizador no formato YYYY-MM-DD. */
export function toLocalIsoDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * No dia de hoje (hora local do utilizador), remove slots já passados.
 * Mantém o slot atual se ainda estiver naquele minuto.
 */
export function filterSlotsFromNow(
  dateIso: string,
  slots: string[],
  now = new Date(),
): string[] {
  if (dateIso !== toLocalIsoDate(now)) {
    return slots
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return slots.filter((slot) => {
    const [hours, minutes] = slot.slice(0, 5).split(':').map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return false
    }
    return hours * 60 + minutes >= nowMinutes
  })
}
