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
  U: { x: 0, y: -1, sym: '^' },
  D: { x: 0, y: 1, sym: 'v' },
  L: { x: -1, y: 0, sym: '<' },
  R: { x: 1, y: 0, sym: '>' }
}
const neighbors = Object.values(directions)

function parseLine (line) {
  // L 4 (#38ce32)
  const match = /([A-Z]) (\d+) \((#[0-9a-f]{6})\)/.exec(line)
  const [, direction, distance, color] = match
  return { direction, distance: Number(distance), color }
}

function parseInstructions (input) {
  return input.split('\n').filter(n => n).map(parseLine)
}

async function solveForFirstStar (input) {
  const instructions = parseInstructions(input)

  let x = 0
  let y = 0
  const startHole = { x, y, color: '#000000', direction: 'U' }
  const digMap = instructions.reduce((map, instruction) => {
    const { direction, distance, color } = instruction
    const dir = directions[direction]
    for (let i = 0; i < distance; i++) {
      x += dir.x
      y += dir.y
      map[`${x},${y}`] = { x, y, color, dir }
    }

    return map
  }, { '0,0': startHole })

  floodFill(digMap, 1, 1, '#000000')

  const dugTiles = Object.keys(digMap).length

  await write(fromHere('map.txt'), renderMap(digMap), 'utf8')

  const solution = dugTiles
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

function floodFill (map, x, y, color) {
  const queue = []
  queue.push({ x, y })

  while (queue.length) {
    const { x, y } = queue.shift()
    const key = `${x},${y}`
    if (!map[key]) {
      map[key] = { x, y, color }
      neighbors.forEach(neighbor => {
        queue.push({ x: x + neighbor.x, y: y + neighbor.y })
      })
    }
  }
}

function renderMap (map) {
  const locations = Object.keys(map)
  const yVals = locations.map(location => location.split(',')[1])
  const xVals = locations.map(location => location.split(',')[0])
  const minX = Math.min(...xVals)
  const maxX = Math.max(...xVals)
  const minY = Math.min(...yVals)
  const maxY = Math.max(...yVals)

  const rows = []
  for (let y = minY; y <= maxY; y++) {
    const row = []
    for (let x = minX; x <= maxX; x++) {
      const hole = map[`${x},${y}`]
      if (x === 0 && y === 0) {
        row.push('S')
      } else if (hole) {
        row.push(hole?.dir?.sym ?? '#')
      } else {
        row.push('.')
      }
    }

    rows.push(row)
  }

  return rows.map(row => row.join('')).join('\n')
}

run()
