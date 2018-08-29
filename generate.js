const fs = require('fs').promises
const path = require('path')
const fetch = require('node-fetch')

const lon2tile = (lon, zoom) =>
  Math.floor((lon + 180) / 360 * Math.pow(2, zoom))

const lat2tile = (lat, zoom) =>
  Math.floor(
    (1 -
      Math.log(
        Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)
      ) /
        Math.PI) /
      2 *
      Math.pow(2, zoom)
  )

const config = {
  prefix: 'nz-akl',
  hostname: 'http://localhost:8090/styles/dymajo-style',
  lat_min: -37.39747,
  lat_max: -36.54297,
  lon_min: 174.43058,
  lon_max: 175.09714,
  zoom_min: 1,
  zoom_max: 3,
}
const generate = async (config, zoom) => {
  const padding = 1
  const start_lat = lat2tile(config.lat_min, zoom) + padding
  const end_lat = lat2tile(config.lat_max, zoom) - padding
  const start_lon = lon2tile(config.lon_min, zoom) - padding
  const end_lon = lon2tile(config.lon_max, zoom) + padding

  const lastExportFile = path.join(__dirname, `/output/${config.prefix}.json`)
  try {
    await fs.stat(lastExportFile)
  } catch (err) {
    await fs.writeFile(lastExportFile, '{}')
  }
  const raw = await fs.readFile(lastExportFile)
  const lastExport = JSON.parse(raw.toString())

  console.log('Generating the following tiles:')
  console.log(`lat: ${end_lat} -> ${start_lat}`)
  console.log(`lon: ${start_lon} -> ${end_lon}`)
  const total = (start_lat - end_lat + 1) * (end_lon - start_lon + 1)
  console.log(`${total} tiles to be generated`)

  // makes the zoom directory if it doesn't already exist
  const zoomDir = path.join(__dirname, `/output/${zoom}`)
  try {
    await fs.stat(zoomDir)
  } catch (err) {
    await fs.mkdir(zoomDir)
  }
  count = 0
  for (let i = start_lon; i <= end_lon; i++) {
    // makes the longitude directory if it doesn't already exist
    const lon_dir = path.join(__dirname, `/output/${zoom}/${i}`)
    try {
      await fs.stat(lon_dir)
    } catch (err) {
      await fs.mkdir(lon_dir)
    }
    for (let j = end_lat; j <= start_lat; j++) {
      const data = await fetch(`${config.hostname}/${zoom}/${i}/${j}@2x.png`)
      if (data.status !== 200) {
        console.log('Error', data.status, i, j)
      } else {
        // looks like nodejs needs a buffer, not an array buffer
        const arrayBuffer = await data.arrayBuffer()
        await fs.writeFile(
          path.join(__dirname, `/output/${zoom}/${i}/${j}@2x.png`),
          Buffer.from(arrayBuffer),
          'utf8'
        )
        console.log('Saved', i, j)
        count++
      }
    }
  }
  if (!lastExport.hasOwnProperty('exports')) {
    lastExport.exports = {}
  }
  lastExport.meta = {
    lat_min: config.lat_min,
    lat_max: config.lat_max,
    lon_min: config.lon_min,
    lon_max: config.lon_max,
  }
  lastExport.exports[zoom] = {
    start_lat: start_lat,
    end_lat: end_lat,
    start_lon: start_lon,
    end_lon: end_lon,
  }
  await fs.writeFile(lastExportFile, JSON.stringify(lastExport, null, 2))
  console.log(`Saved ${count} tiles. Skipped ${total - count}.`)
}

start = async () => {
  for (let zoom = config.zoom_min; zoom <= config.zoom_max; zoom++) {
    await generate(config, zoom)
  }
}
start()
