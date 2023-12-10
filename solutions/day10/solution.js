const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const directions = {
  UP: { name: 'up', x: 0, y: -1 },
  DOWN: { name: 'down', x: 0, y: 1 },
  LEFT: { name: 'left', x: -1, y: 0 },
  RIGHT: { name: 'right', x: 1, y: 0 }
}

const pipeTypes = {
  '-': { exits: [directions.LEFT, directions.RIGHT], name: 'horizontal' },
  '|': { exits: [directions.UP, directions.DOWN], name: 'vertical' },
  F: { exits: [directions.RIGHT, directions.DOWN], name: 'F corner' },
  7: { exits: [directions.LEFT, directions.DOWN], name: '7 corner' },
  L: { exits: [directions.UP, directions.RIGHT], name: 'L corner' },
  J: { exits: [directions.UP, directions.LEFT], name: 'J corner' },
  '.': { exits: [], name: 'floor' },
  S: { exits: [...Object.values(directions)], name: 'start' },
  '?': { exits: [], name: 'unknown' }
}

function parsePipeMap (input) {
  const pipeMap = {
    locations: {},
    pipes: []
  }
  pipeMap.pipes = input.split('\n').map(line => line.trim()).filter(line => line.length > 0).forEach((line, y) => {
    const row = line.split('').map((char, x) => {
      const pipe = pipeTypes[char] ?? pipeTypes['?']
      pipeMap.locations[`${x},${y}`] = { x, y, ...pipe }
      return pipe
    })
    return row
  })
  return pipeMap
}

function followRoute (pipeMap, startDirection) {
  const route = []
  const startLocation = Object.values(pipeMap.locations).find(location => location.name === 'start')
  let currentLocation = startLocation
  let currentDirection = startDirection
  while (route.includes(currentLocation) === false) {
    route.push(currentLocation)
    const nextKey = `${currentLocation.x + currentDirection.x},${currentLocation.y + currentDirection.y}`
    const nextLocation = pipeMap.locations[nextKey]
    if (nextLocation === undefined) {
      console.log('Hit a dead end', currentLocation, currentDirection)
      break
    }
    const newDirection = nextLocation.exits.find(exit => {
      const exitKey = `${nextLocation.x + exit.x},${nextLocation.y + exit.y}`
      const exitLocation = pipeMap.locations[exitKey]
      return exitLocation !== currentLocation
    })

    if (!newDirection) {
      console.log('Couldn\'t find an exit', { currentLocation, nextLocation, currentDirection })
      break
    }

    currentDirection = newDirection
    currentLocation = nextLocation
  }
  route.push(currentLocation)

  const routeStart = route[0]
  const routeEnd = route[route.length - 1]
  console.log('Completed loop', routeStart === routeEnd ? 'Back at start' : 'Not back at start', { routeStart, routeEnd, length: route.length }, 'locations')
  return route
}

async function solveForFirstStar (input) {
  const pipeMap = parsePipeMap(input)

  const routes = Object.values(directions).map(direction => {
    return followRoute(pipeMap, direction)
  })

  const fullRoute = routes.find(route => route.filter(location => location.name === 'start').length === 2)

  await write(fromHere('output.json'), JSON.stringify(pipeMap, null, 2), 'utf8')
  await write(fromHere('routes.json'), JSON.stringify(routes, null, 2), 'utf8')

  const solution = Math.floor(fullRoute.length / 2)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
