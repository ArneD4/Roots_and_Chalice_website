const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTiyOLYQ-bjjC3b97vZqcSWQxT-jU4cYJXOU39U8QA4eMRiEk4uqByVjXiBda_D-nfRfWUcRR1Cm0AD/pub?gid=901253624&single=true&output=csv'

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