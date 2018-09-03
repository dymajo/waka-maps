const fs = require('fs').promises
const path = require('path')
const fetch = require('node-fetch')
const colors = require('colors')

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

const padding = 5
const verbose = false
const log = {
  log: (...a) => console.log(...a),
  info: (...a) => console.log(...a),
  debug: (...a) => (verbose ? console.log(...a) : null),
  warn: (...a) => console.warn(...a),
  error: (...a) => console.error(...a),
}

const config = {
  prefix: 'nz-wlg',
  hostname: 'http://localhost:8090/styles/dymajo-style',
  lat_min: -41.348104,
  lat_max: -40.623161,
  lon_min: 174.722002,
  lon_max: 175.684255,
  zoom_min: 11,
  zoom_max: 17,
}
const generate = async (config, zoom) => {
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

  log.log('Zoom Level:'.cyan, zoom)
  log.log('Generating the following tiles:'.magenta)
  log.log(`lat: ${end_lat} -> ${start_lat}`)
  log.log(`lon: ${start_lon} -> ${end_lon}`)

  let skip_start_lat = null
  let skip_end_lat = null
  let skip_start_lon = null
  let skip_end_lon = null
  let totalSkipped = 0
  if (
    lastExport.hasOwnProperty('exports') &&
    lastExport.exports.hasOwnProperty(zoom)
  ) {
    skip_start_lat = lastExport.exports[zoom].start_lat
    skip_end_lat = lastExport.exports[zoom].end_lat
    skip_start_lon = lastExport.exports[zoom].start_lon
    skip_end_lon = lastExport.exports[zoom].end_lon

    log.log('Skipping following tiles:'.magenta)
    log.log(`lat: ${skip_end_lat} -> ${skip_start_lat}`)
    log.log(`lon: ${skip_start_lon} -> ${skip_end_lon}`)
    totalSkipped =
      (skip_start_lat - skip_end_lat + 1) * (skip_end_lon - skip_start_lon + 1)
  }

  const total =
    (start_lat - end_lat + 1) * (end_lon - start_lon + 1) - totalSkipped
  log.log(`${total} tiles to be generated`.magenta)

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
      if (
        j >= skip_end_lat &&
        j <= skip_start_lat &&
        i >= skip_start_lon &&
        i <= skip_end_lon
      ) {
        log.debug('Skipping', i, j)
        continue
      }
      const data = await fetch(`${config.hostname}/${zoom}/${i}/${j}@2x.png`)
      if (data.status !== 200) {
        log.warn('Error', data.status, i, j)
      } else {
        // looks like nodejs needs a buffer, not an array buffer
        const arrayBuffer = await data.arrayBuffer()
        await fs.writeFile(
          path.join(__dirname, `/output/${zoom}/${i}/${j}@2x.png`),
          Buffer.from(arrayBuffer),
          'utf8'
        )
        log.debug('Saved', i, j)
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
  log.log(`Saved ${count} tiles. Skipped ${total - count}.`.green)
  log.log('')
}

start = async () => {
  for (let zoom = config.zoom_min; zoom <= config.zoom_max; zoom++) {
    await generate(config, zoom)
  }
}
start()
