const MIXCLOUD_USERNAME = 'Roots_and_Chalice'

// fetches just one show's key, used to silently bootstrap the player widget on page load
export async function fetchBootstrapKey() {
  const response = await fetch(`https://api.mixcloud.com/${MIXCLOUD_USERNAME}/cloudcasts/?limit=1`)
  if (!response.ok) return null
  const data = await response.json()
  return data.data[0]?.key ?? null
}

export async function fetchShows() {
  let url = `https://api.mixcloud.com/${MIXCLOUD_USERNAME}/cloudcasts/?limit=100`
  const shows = []

  while (url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch Mixcloud shows')
    }
    const data = await response.json()

    const mapped = data.data.map(show => ({
      title: show.name,
      date: new Date(show.created_time).toLocaleDateString('nl-BE'),
      createdAt: show.created_time,
      playCount: show.play_count,
      key: show.key,
      url: show.url
    }))
    shows.push(...mapped)

    url = data.paging.next
  }

  return shows
}