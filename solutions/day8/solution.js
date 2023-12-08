const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parsePuzzleMap (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  const directions = lines.shift().split('')
  const locations = lines.map(parseLocation)

  const locationMap = locations.reduce((map, location) => {
    map[location.locId] = location
    return map
  }, {})

  return { directions, locations, locationMap }
}

// VJN = (LNC, RRK)
function parseLocation (line) {
  const matcher = /(\w+) = \((\w+), (\w+)\)/
  const [, locId, leftId, rightId] = line.match(matcher)
  return { locId, leftId, rightId }
}

function countSteps (start, destination, directions, locationMap) {
  let current = start
  let steps = 0
  while (current.locId !== destination.locId) {
    const direction = directions[steps % directions.length]
    steps++
    if (direction === 'L') {
      current = locationMap[current.leftId]
    } else if (direction === 'R') {
      current = locationMap[current.rightId]
    }
  }
  return steps
}

function findDistancetoZ (start, directions, locationMap) {
  let current = start
  let steps = 0
  console.log('Start:', start, 'Directions:', directions)
  const path = []
  let currentLocationId = start.locId
  while (currentLocationId.charAt(2) !== 'Z') {
    const direction = directions[steps % directions.length]
    const executionKey = `${direction}+${current.locId}+${locationMap[direction === 'L' ? current.leftId : current.rightId].locId}`
    if (path.includes(executionKey)) {
      console.log('Loop detected:', executionKey, 'Steps:', steps)
      break
    }
    path.push(executionKey)
    console.log('Direction:', direction, 'Current:', current, 'Steps:', steps, 'Char:', current.locId.charAt(2))
    steps++
    if (direction === 'L') {
      current = locationMap[current.leftId]
    } else if (direction === 'R') {
      current = locationMap[current.rightId]
    }
    currentLocationId = current.locId
  }
  const end = current
  const distance = steps
  return { end, distance }
}

async function solveForFirstStar (input) {
  const puzzleMap = parsePuzzleMap(input)

  const start = puzzleMap.locationMap.AAA
  const destination = puzzleMap.locationMap.ZZZ

  if (!start || !destination) {
    console.log('Start or destination not found in map:', start, destination)
    return
  }

  const steps = countSteps(start, destination, puzzleMap.directions, puzzleMap.locationMap)
  const solution = steps

  await write(fromHere('puzzle-map.json'), JSON.stringify(puzzleMap, null, 2), 'utf8')

  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const puzzleMap = parsePuzzleMap(input)

  const directions = ['L', 'R']
  const startLocations = puzzleMap.locations.filter(location => location.locId.charAt(2) === 'A')
  const endLocations = puzzleMap.locations.filter(location => location.locId.charAt(2) === 'Z')

  console.log('Start locations:', startLocations)
  console.log('End locations:', endLocations)

  const distanceMap = startLocations.reduce((map, start) => {
    console.log('Path from start:', start)
    const { end, distance } = findDistancetoZ(start, directions, puzzleMap.locationMap)
    const key = `${start.locId}-->${end.locId}`
    map[key] = { start, end, distance }
    return map
  }, {})

  await write(fromHere('distance-map.json'), JSON.stringify(distanceMap, null, 2), 'utf8')

  /*
  let currentLocations = startLocations
  let steps = 0
  let destinationCheck = []
  console.log('Start locations:', startLocations)
  while (destinationCheck.length < currentLocations.length) {
    const direction = directions[steps % directions.length]
    steps++
    if (direction === 'L') {
      currentLocations = currentLocations.map(current => puzzleMap.locationMap[current.leftId])
    } else if (direction === 'R') {
      currentLocations = currentLocations.map(current => puzzleMap.locationMap[current.rightId])
    }
    destinationCheck = currentLocations.filter(current => current.locId.charAt(2) === 'Z')
    if (steps % 10000000 === 0) {
      console.log('Steps:', steps, 'Current locations:', currentLocations)
    }
  }
  console.log('End locations:', currentLocations)
  */

  const solution = '???'
  report('Solution 2:', solution)
}

run()
