const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('example.txt'), 'utf8')).trim()

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
  let char = ''
  let x = 0

  // Scan line
  while (x < line.length) {
    const coordKey = `${x},${y}`
    const bufferInt = parseInt(buffer)
    char = line.charAt(x)
    if (char === '.') {
      if (Number.isNaN(bufferInt) === false) {
        const item = { x: x - buffer.length + 1, y, val: bufferInt, xEnd: x }
        for (let i = 0; i < buffer.length; i++) {
          const xOffset = x - buffer.length + 1 + i
          items[`${xOffset},${y}`] = item
        }
      } else if (buffer !== '') {
        items[coordKey] = { x, y, sym: buffer }
      }
      buffer = ''
    } else {
      // Store symbol followed by number
      const charIsDigit = char >= '0' && char <= '9'
      if (charIsDigit && Number.isNaN(bufferInt) && buffer !== '') {
        items[coordKey] = { x, y, sym: buffer }
        buffer = ''
      } else {
        buffer += char
      }
    }
    x++
  }

  // Handle end of line
  const bufferInt = parseInt(buffer)
  if (Number.isNaN(bufferInt) === false) {
    const item = { x: x - buffer.length + 1, y, val: bufferInt, xEnd: x }
    for (let i = 0; i < buffer.length; i++) {
      const xOffset = x - buffer.length + 1 + i
      items[`${xOffset},${y}`] = item
    }
  }
  if (buffer !== '') {
    const coordKey = `${x},${y}`
    items[coordKey] = { x, y, sym: buffer }
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
  diagram.partsSum = diagram.parts.reduce((sum, part) => sum + part.val, 0)

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
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
