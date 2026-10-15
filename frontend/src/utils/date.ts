export function formatLocalDateForApi(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatLocalDateForDisplay(date: Date) {
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)

  return formattedDate.charAt(0).toLocaleUpperCase('es-AR') + formattedDate.slice(1)
}

export function formatDateCell(dateValue: string | null) {
  if (!dateValue) {
    return '-'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function normalizeDateForSearch(dateValue: string | null) {
  if (!dateValue) {
    return ''
  }

  return formatDateCell(dateValue).toLocaleLowerCase('es-AR')
}
