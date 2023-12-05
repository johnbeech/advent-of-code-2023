const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)
async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseAlamac (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  const seeds = lines.shift().split(':')[1].trim().split(' ').map(Number)

  const testLine = /([A-z-]+) map:/
  const maps = lines.reduce((acc, line) => {
    const mapName = testLine.exec(line)?.[1]
    if (mapName) {
      const [source, destination] = mapName.split('-to-')
      acc[mapName] = {
        name: mapName,
        source: source.trim(),
        destination: destination.trim(),
        items: []
      }
      acc.currentMap = mapName
    } else {
      const [destinationRangeStart, sourceRangeStart, rangeLength] = line.split(' ').map(Number)
      acc[acc.currentMap].items.push({
        destinationRangeStart,
        sourceRangeStart,
        rangeLength
      })
    }
    return acc
  }, {})

  Object.values(maps).forEach(map => {
    map.nextMap = () => {
      return Object.values(maps).find(m2 => m2.source === map.destination)
    }
  })

  delete maps.currentMap

  return {
    seeds,
    maps
  }
}

function getSeed (alamac, seed, source) {
  const sourceMap = Object.values(alamac.maps).find(map => map.source === source)
  let value = null

  const match = sourceMap.items.find(item => seed >= item.sourceRangeStart && seed < item.sourceRangeStart + item.rangeLength)
  if (match) {
    value = match.destinationRangeStart + (seed - match.sourceRangeStart)
  } else {
    value = seed
  }

  const seedInfo = {
    seed,
    source,
    destination: sourceMap.destination,
    value,
    match
  }

  // console.log('[getSeed]', seedInfo)
  console.log(source, seed, sourceMap.destination, value)

  return seedInfo
}

function resolveSeed (alamac, seed, source, destination) {
  const seedInfo = getSeed(alamac, seed, source)
  if (seedInfo.destination === destination) {
    return seedInfo.value
  } else {
    return resolveSeed(alamac, seedInfo.value, seedInfo.destination, destination)
  }
}

async function solveForFirstStar (input) {
  const alamac = parseAlamac(input)

  await write(fromHere('alamac.json'), JSON.stringify(alamac, null, 2), 'utf8')

  const locations = alamac.seeds.map(seed => {
    console.log('Searching for location from seed', seed)
    const location = resolveSeed(alamac, seed, 'seed', 'location')
    console.log('Found location', location, 'from', seed)
    console.log('---------------')
    return { seed, location }
  })

  await write(fromHere('locations.json'), JSON.stringify(locations, null, 2), 'utf8')

  const lowestLocation = locations.sort((a, b) => a.location - b.location)[0]
  const solution = lowestLocation.location
  // report('Input:', input)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
