const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const searchCoords = [
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: 1 },
  { x: 0, y: 1 },
  { x: 1, y: 1 }
]

function parseDiagramLine (line, y) {
  const items = {}
  let buffer = ''
  let x = 0

  // Scan line
  while (x < line.length) {
    buffer += line.charAt(x)
    const lookAhead = String(line).charAt(x + 1)
    const coordKey = `${x},${y}`
    const bufferOnlyContainsDigits = /^[\d]+$/.test(buffer)
    const lookAheadIsDigit = /^[\d]+$/.test(lookAhead)
    if (buffer === '.') {
      // Reset buffer
      buffer = ''
    } else if (bufferOnlyContainsDigits && lookAheadIsDigit) {
      // Do nothing
    } else if (bufferOnlyContainsDigits && !lookAheadIsDigit) {
      // Store number
      const val = parseInt(buffer)
      const valItem = { x: x - buffer.length + 1, y, val }
      for (let i = 0; i < buffer.length; i++) {
        const coordKey = `${x - buffer.length + i + 1},${y}`
        items[coordKey] = valItem
      }
      buffer = ''
    } else if (!bufferOnlyContainsDigits) {
      // Store symbol
      const symItem = { x, y, sym: buffer }
      items[coordKey] = symItem
      buffer = ''
    } else {
      throw new Error(`Unexpected state: ${buffer} ${lookAhead}`)
    }

    x++
  }

  return items
}

function parseDiagram (input) {
  const lines = input.split('\n').map(n => n.trim()).filter(n => n)
  const diagram = lines.reduce((diagram, line, yCoord) => {
    const coordItems = parseDiagramLine(line, yCoord)
    Object.assign(diagram.items, coordItems)
    return diagram
  }, { items: {} })

  diagram.symbolItems = Object.values(diagram.items).filter(n => n.sym)
  diagram.numberItems = Object.values(diagram.items).filter(n => n.val)

  Object.values(diagram.symbolItems).forEach(item => {
    const neighbours = findNeighbours(diagram, item)
    console.log('Neighbours:', { item, neighbours })
    item.neighbours = neighbours.filter(n => n.val).map(n => `${n.x},${n.y}`)
    item.neighbourVals = neighbours.filter(n => n.val).map(n => n.val)

    neighbours.filter(n => n.val).forEach(n => {
      n.part = true
    })
  })

  diagram.parts = [...new Set(Object.values(diagram.items).filter(n => n.part))]
  diagram.notParts = [...new Set(Object.values(diagram.items).filter(n => n.part !== true && n.val > 0))]
  diagram.gears = diagram.symbolItems.filter(item => item.sym === '*' && item.neighbours.length === 2).map(item => {
    item.gearRatio = item.neighbourVals[0] * item.neighbourVals[1]
    return item
  })

  diagram.partsSum = diagram.parts.reduce((sum, part) => sum + part.val, 0)
  diagram.gearSum = diagram.gears.reduce((sum, gear) => sum + gear.gearRatio, 0)

  return diagram
}

function findNeighbours (diagram, item) {
  const neighbours = []
  searchCoords.forEach(searchCoord => {
    const coordKey = `${item.x + searchCoord.x},${item.y + searchCoord.y}`
    const neighbour = diagram.items[coordKey]
    if (neighbour) {
      neighbours.push(neighbour)
    }
  })
  const set = new Set(neighbours)
  return [...set]
}

async function solveForFirstStar (input) {
  const diagram = parseDiagram(input)

  await write(fromHere('diagram.json'), JSON.stringify(diagram, null, 2), 'utf8')
  await write(fromHere('diagram-parts.json'), JSON.stringify(diagram.parts, null, 2), 'utf8')
  await write(fromHere('diagram-not-parts.json'), JSON.stringify(diagram.notParts, null, 2), 'utf8')

  const solution = diagram.partsSum
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const diagram = parseDiagram(input)

  await write(fromHere('diagram-gears.json'), JSON.stringify(diagram.gears, null, 2), 'utf8')

  const solution = diagram.gearSum
  report('Solution 2:', solution)
}

run()
