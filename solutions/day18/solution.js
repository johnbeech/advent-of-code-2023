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

function parseColors (input) {
  /**
   * Each hexadecimal code is six hexadecimal digits long. The first five hexadecimal digits encode the distance in meters as a five-digit hexadecimal number.
   * The last hexadecimal digit encodes the direction to dig: 0 means R, 1 means D, 2 means L, and 3 means U.
   *
   * e.g. #70c710 = R 461937
   */
  return input.split('\n').filter(n => n).map((line) => {
    const match = /#([0-9a-f]{5})([0-3])/.exec(line)
    const [, distance, direction] = match
    return { direction: ['R', 'D', 'L', 'U'][Number(direction)], distance: Number.parseInt('0x' + distance) }
  })
}

async function solveForSecondStar (input) {
  const instructions = parseColors(input)

  let x = 0
  let y = 0
  const vertices = []
  let p = 0

  for (const { direction, distance } of instructions) {
    x = x + (directions[direction].x * distance)
    y = y + (directions[direction].y * distance)
    vertices.push({ x, y })
    p = p + distance
  }

  // Apply the Shoelace Formula to calculate the area
  const n = vertices.length
  let area = 0
  for (let i = 0; i < n - 1; i++) {
    area += vertices[i].x * vertices[i + 1].y
    area -= vertices[i + 1].x * vertices[i].y
  }
  area = Math.abs(area) / 2 + (p / 2) + 1

  console.log('Area:', area, 'Perimeter:', p, 'Vertices:', vertices.length
  )
  const solution = area
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
