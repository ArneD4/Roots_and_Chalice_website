const url = '/planning.php?format=csv'

function parseCsv(csvText) {
  const rows = [[]]
  let field = ''
  let inQuotes = false

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index]

    if (character === '"') {
      if (inQuotes && csvText[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (character === ',' && !inQuotes) {
      rows.at(-1).push(field.trim())
      field = ''
    } else if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && csvText[index + 1] === '\n') index += 1
      rows.at(-1).push(field.trim())
      field = ''
      rows.push([])
    } else {
      field += character
    }
  }

  if (field || rows.at(-1).length) rows.at(-1).push(field.trim())
  return rows.filter((row) => row.some(Boolean))
}

export async function fetchSheetData() {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch the show schedule')
  }

  const csvText = await response.text()
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear() % 100
  const currentMonth = currentDate.getMonth() + 1

  return parseCsv(csvText)
    .slice(2)
    .map((row) => {
      const scriptDate = row[0]
      const day = Number(row[2])
      const year = Number(scriptDate.slice(0, 2))
      const month = Number(scriptDate.slice(2, 4))

      return {
        date: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
        label: row[4],
        year,
        month,
      }
    })
    .filter((show) => show.year === currentYear && show.month === currentMonth && show.label)
}

const brusselsFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Brussels',
  weekday: 'short',
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function getBrusselsNow(date = new Date()) {
  const parts = Object.fromEntries(brusselsFormat.formatToParts(date).map((part) => [part.type, part.value]))
  return {
    weekday: parts.weekday,
    scriptDate: `${parts.year}${parts.month}${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

// live every Tuesday from 21:00 until 22:30 Belgian time
export function isLiveNow(date = new Date()) {
  const { weekday, minutes } = getBrusselsNow(date)
  return weekday === 'Tue' && minutes >= 21 * 60 && minutes < 22 * 60 + 30
}

export async function fetchTodaysShow() {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch the show schedule')
  }

  const { scriptDate } = getBrusselsNow()
  const row = parseCsv(await response.text())
    .slice(2)
    .find((item) => item[0] === scriptDate && item[4])

  return row ? { title: row[4], type: row[3], description: row[7] } : null
}