const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

class MathHelpers {
  static gcd (a, b) {
    if (b === 0) return a
    return MathHelpers.gcd(b, a % b)
  }

  static lcm (a, b) {
    return (a * b) / MathHelpers.gcd(a, b)
  }
}

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
  console.log('Find distance to Z from:', start)
  while (!current.locId.endsWith('Z')) {
    const direction = directions[steps % directions.length]
    const nextNode = locationMap[direction === 'L' ? current.leftId : current.rightId]
    steps++
    current = nextNode
  }
  console.log('Found Z at:', current, 'after', steps, 'steps')
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

  const directions = puzzleMap.directions // ['L', 'R']
  const startLocations = puzzleMap.locations.filter(location => location.locId.endsWith('A'))
  const endLocations = puzzleMap.locations.filter(location => location.locId.endsWith('Z'))

  console.log('Start locations:', startLocations)

  const distanceMap = startLocations.reduce((map, start) => {
    console.log('Path from start:', start)
    const { end, distance } = findDistancetoZ(start, directions, puzzleMap.locationMap)
    const key = `${start.locId}-->${end.locId}`
    map[key] = { start, end, distance }
    return map
  }, {})

  console.log('End locations:', endLocations)
  console.log('Distance map:', distanceMap)

  await write(fromHere('distance-map.json'), JSON.stringify(distanceMap, null, 2), 'utf8')

  const stepsToAlign = Object.values(distanceMap)
    .map(item => item.distance)
    .reduce((acc, curr) => MathHelpers.lcm(acc, curr), 1)

  const solution = stepsToAlign
  report('Solution 2:', solution)
}

run()
