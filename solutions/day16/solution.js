const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
}

const mirrors = {
  '/': {
    right: ['up'],
    left: ['down'],
    up: ['right'],
    down: ['left']
  },
  '\\': {
    right: ['down'],
    left: ['up'],
    up: ['left'],
    down: ['right']
  },
  '-': {
    right: ['right'],
    left: ['left'],
    up: ['left', 'right'],
    down: ['left', 'right']
  },
  '|': {
    right: ['up', 'down'],
    left: ['up', 'down'],
    up: ['up'],
    down: ['down']
  }
}

function createTile (char, x, y) {
  const empty = char === '.'
  const mirror = mirrors[char]
  return {
    char,
    mirror,
    x,
    y,
    empty,
    energised: {
      up: 0,
      down: 0,
      left: 0,
      right: 0
    }
  }
}

function parseMirrorLayout (input) {
  const layout = []
  input.split('\n').forEach((line, y) => {
    const row = line.trim().split('').map((char, x) => createTile(char, x, y))
    layout.push(row)
  })
  return layout
}

function travelLight (layout, tile, direction) {
  if (tile === undefined) {
    return []
  }
  if (tile.energised[direction] > 1) {
    return []
  }
  const results = []
  tile.energised[direction]++
  if (tile.empty) {
    const directionOffset = directions[direction]
    const nextTile = layout[tile.y + directionOffset.y]?.[tile.x + directionOffset.x]
    if (nextTile === undefined) {
      return []
    }
    results.push({ tile: nextTile, direction })
  } else {
    tile.mirror[direction].forEach(newDirection => {
      const directionOffset = directions[newDirection]
      const nextTile = layout[tile.y + directionOffset.y]?.[tile.x + directionOffset.x]
      if (nextTile === undefined) {
        return
      }
      results.push({ tile: nextTile, direction: newDirection })
    })
  }
  return results
}

function displayLayout (layout) {
  const output = layout.map(row => row.map(tile => tile.energyTotal).join('')).join('\n')
  return output
}

function countEnergisedTiles (layout) {
  return layout.reduce((acc, row) => {
    return acc + row.reduce((acc, tile) => {
      tile.energyTotal = tile.energised.up + tile.energised.down + tile.energised.left + tile.energised.right
      return acc + (tile.energyTotal > 0 ? 1 : 0)
    }, 0)
  }, 0)
}

function energiseLayout (layout, start, startDirection) {
  start = layout[start.y]?.[start.x]
  const nextInstructions = [{ tile: start, direction: startDirection }]
  let i = 0
  while (nextInstructions.length > 0) {
    const { tile, direction } = nextInstructions.shift()
    const newInstructions = travelLight(layout, tile, direction)
    nextInstructions.push(...newInstructions)
    i++
  }
  layout.processed = i
  return layout
}

async function solveForFirstStar (input) {
  const layout = parseMirrorLayout(input)

  const start = layout[0][0]
  const startDirection = 'right'
  energiseLayout(layout, start, startDirection)
  const solution = countEnergisedTiles(layout)

  report(displayLayout(layout))
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const layout = parseMirrorLayout(input)

  const topEdge = []
  const bottomEdge = []
  const leftEdge = []
  const rightEdge = []
  while (topEdge.length < layout[0].length) {
    topEdge.push({ tile: layout[0][topEdge.length], direction: 'down' })
  }
  while (bottomEdge.length < layout[0].length) {
    bottomEdge.push({ tile: layout[layout.length - 1][bottomEdge.length], direction: 'up' })
  }
  while (leftEdge.length < layout.length) {
    leftEdge.push({ tile: layout[leftEdge.length][0], direction: 'right' })
  }
  while (rightEdge.length < layout.length) {
    rightEdge.push({ tile: layout[rightEdge.length][layout[0].length - 1], direction: 'left' })
  }
  const startPositions = [...topEdge, ...bottomEdge, ...leftEdge, ...rightEdge]

  console.log('Start positions:', { topEdge, bottomEdge, leftEdge, rightEdge })

  const results = startPositions.map(({ tile, direction }) => {
    const layoutCopy = JSON.parse(JSON.stringify(layout))
    const result = energiseLayout(layoutCopy, tile, direction)
    const count = countEnergisedTiles(layoutCopy)
    console.log('Result:', [tile.x, tile.y].join(','), direction, 'Energised:', count, 'Iterations:', result.processed)
    console.log(displayLayout(result))
    return count
  })

  const solution = Math.max(...results)
  report('Solution 2:', solution)
}

run()
