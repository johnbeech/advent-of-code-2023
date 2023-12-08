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

async function solveForFirstStar (input) {
  const puzzleMap = parsePuzzleMap(input)

  const start = puzzleMap.locationMap.AAA
  const destination = puzzleMap.locationMap.ZZZ

  let current = start
  const path = []
  while (current.locId !== destination.locId) {
    const direction = puzzleMap.directions[path.length % puzzleMap.directions.length]
    path.push(current)
    if (direction === 'L') {
      current = puzzleMap.locationMap[current.leftId]
    } else if (direction === 'R') {
      current = puzzleMap.locationMap[current.rightId]
    }
  }

  const solution = path.length

  await write(fromHere('puzzle-map.json'), JSON.stringify(puzzleMap, null, 2), 'utf8')
  await write(fromHere('part-1-path.json'), JSON.stringify(path, null, 2), 'utf8')

  report('Input:', input)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
