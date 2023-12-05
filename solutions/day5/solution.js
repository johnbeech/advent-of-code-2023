const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)
async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const mapMap = {}

function parseAlamac (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  const seeds = lines.shift().split(':')[1].trim().split(' ').map(Number)
  const seedPairs = seeds.reduce((acc, seed) => {
    // group seeds into pairs
    if (acc.length) {
      const lastPair = acc[acc.length - 1]
      if (lastPair.length === 1) {
        lastPair.push(seed)
      } else {
        acc.push([seed])
      }
    } else {
      acc.push([seed])
    }
    return acc
  }, [])

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
    mapMap[map.source] = map
  })

  delete maps.currentMap

  return {
    seeds,
    seedPairs,
    maps
  }
}

function convertSeed (alamac, seed, source, log = false) {
  const sourceMap = mapMap[source]
  let value = null

  const match = sourceMap.items.find(item => seed >= item.sourceRangeStart && seed < item.sourceRangeStart + item.rangeLength)
  if (match) {
    value = match.destinationRangeStart + (seed - match.sourceRangeStart)
  } else {
    value = seed
  }

  if (log) {
    // console.log('[getSeed]', seedInfo)
    console.log(source, seed, sourceMap.destination, value)
  }

  return value
}

function resolveSeed (alamac, seed, source, destination, log = false) {
  const sourceMap = mapMap[source]
  const destinationMap = mapMap[sourceMap.destination]
  if (destinationMap === undefined) {
    return convertSeed(alamac, seed, source, log)
  } else {
    const newSeed = convertSeed(alamac, seed, source, log)
    return resolveSeed(alamac, newSeed, sourceMap.destination, destination)
  }
}

async function solveForFirstStar (input) {
  const alamac = parseAlamac(input)

  console.log('Map map', mapMap)

  await write(fromHere('alamac.json'), JSON.stringify(alamac, null, 2), 'utf8')

  const locations = alamac.seeds.map(seed => {
    console.log('Searching for location from seed', seed)
    const location = resolveSeed(alamac, seed, 'seed', 'location', true)
    console.log('Found location', location, 'from', seed)
    console.log('---------------')
    return { seed, location }
  })

  await write(fromHere('locations.json'), JSON.stringify(locations, null, 2), 'utf8')

  const lowestLocation = locations.sort((a, b) => a.location - b.location)[0]

  const solution = lowestLocation.location
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const alamac = parseAlamac(input)

  let lowestLocation
  alamac.seedPairs.forEach(seedPair => {
    console.log('Searching for location from seed pair', seedPair)
    const rangeStart = seedPair[0]
    const rangeEnd = rangeStart + seedPair[1]
    for (let seed = rangeStart; seed < rangeEnd; seed++) {
      const location = resolveSeed(alamac, seed, 'seed', 'location')
      lowestLocation = lowestLocation === undefined || location < lowestLocation ? location : lowestLocation
    }
  })

  const solution = lowestLocation
  report('Solution 2:', solution)
}

run()
