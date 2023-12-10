const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('example.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const directions = {
  UP: { name: 'up', x: 0, y: -1, symbol: '↑', startRotation: 0 },
  DOWN: { name: 'down', x: 0, y: 1, symbol: '↓', startRotation: 180 },
  LEFT: { name: 'left', x: -1, y: 0, symbol: '←', startRotation: 270 },
  RIGHT: { name: 'right', x: 1, y: 0, symbol: '→', startRotation: 90 }
}

const rotations = {
  0: { direction: directions.UP, symbol: '↑' },
  90: { direction: directions.RIGHT, symbol: '→' },
  180: { direction: directions.DOWN, symbol: '↓' },
  270: { direction: directions.LEFT, symbol: '←' }
}

const pipeTypes = {
  '-': { exits: [directions.LEFT, directions.RIGHT], name: 'horizontal', symbol: '-', rotation: 0 },
  '|': { exits: [directions.UP, directions.DOWN], name: 'vertical', symbol: '|', rotation: 0 },
  F: { exits: [directions.DOWN, directions.RIGHT], name: 'F corner', symbol: '┌', rotation: 90 },
  7: { exits: [directions.DOWN, directions.LEFT], name: '7 corner', symbol: '┐', rotation: -90 },
  L: { exits: [directions.UP, directions.RIGHT], name: 'L corner', symbol: '└', rotation: -90 },
  J: { exits: [directions.UP, directions.LEFT], name: 'J corner', symbol: '┘', rotation: 90 },
  '.': { exits: [], name: 'floor', symbol: '.', rotation: 0 },
  S: { exits: [...Object.values(directions)], name: 'start', symbol: 'S', rotation: 0 },
  '?': { exits: [], name: 'unknown', symbol: '?' }
}

function parsePipeMap (input) {
  const pipeMap = {
    locations: {},
    pipes: []
  }
  pipeMap.pipes = input.split('\n').map(line => line.trim()).filter(line => line.length > 0).map((line, y) => {
    const row = line.split('').map((char, x) => {
      const pipe = pipeTypes[char] ?? pipeTypes['?']
      const location = { x, y, ...pipe }
      pipeMap.locations[`${x},${y}`] = location
      return location
    })
    return row
  })
  return pipeMap
}

function followRoute (pipeMap, startDirection) {
  const route = []
  const startLocation = Object.values(pipeMap.locations).find(location => location.name === 'start')
  let rotation = startDirection.startRotation
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

    nextLocation.exit = newDirection
    const pipeRotation = (newDirection === nextLocation.exits[0]) ? nextLocation.rotation : -nextLocation.rotation
    rotation = (720 + rotation - pipeRotation) % 360
    console.log(rotations[rotation].symbol, pipeRotation)
    if (nextLocation.symbol !== 'S') {
      nextLocation.travel = rotations[rotation]?.symbol
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

function floodFill (locations, x, y, symbol) {
  const visited = []
  const start = locations[`${x},${y}`]
  const startSymbol = start.symbol
  const unvisited = [start]
  const exits = Object.values(directions)
  console.log('Flood filling', { x, y, symbol, startSymbol })
  while (unvisited.length > 0) {
    const location = unvisited.pop()
    if (location === undefined) {
      // ignore
    } else if (location.symbol === symbol) {
      // ignore
    } else if (visited.includes(location)) {
      // ignore
    } else if (location.symbol !== startSymbol) {
      // ignore
    } else {
      location.symbol = symbol
      visited.push(location)
      const newLocations = exits.map(exit => locations[`${location.x + exit.x},${location.y + exit.y}`])
        .filter(location => visited.includes(location) === false && unvisited.includes(location) === false)
      unvisited.push(...newLocations)
    }
  }
  console.log('Flood filled', visited.length, 'locations')
}

async function solveForSecondStar (input) {
  const pipeMap = parsePipeMap(input)

  const routes = Object.values(directions).map(direction => {
    return followRoute(pipeMap, direction)
  })

  const fullRoute = routes.find(route => route.length > 2 && route.filter(location => location.name === 'start').length === 2)

  console.log('Full route:', fullRoute)

  Object.values(pipeMap.locations).forEach(location => {
    if (!fullRoute.includes(location)) {
      delete location.exits
      location.symbol = '.'
    }
  })

  const outside = 'o'
  const inside = 'i'
  floodFill(pipeMap.locations, 0, 0, outside)
  const halfSize = Math.round(pipeMap.pipes.length / 2)
  if (pipeMap.locations[`${halfSize},${halfSize}`].symbol !== outside) {
    floodFill(pipeMap.locations, halfSize, halfSize, inside)
  }

  fullRoute.forEach(location => {
    location.symbol = location.travel ?? location.symbol
  })

  const outputText = pipeMap.pipes.map(row => row.map(pipe => pipe.symbol).join('')).join('\n')
  await write(fromHere('output.txt'), outputText, 'utf8')

  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
