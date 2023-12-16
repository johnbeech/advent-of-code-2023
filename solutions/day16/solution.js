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
    const row = line.split('').map((char, x) => createTile(char, x, y))
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
  const nextInstructions = [{ tile: start, direction: startDirection }]
  while (nextInstructions.length > 0) {
    const { tile, direction } = nextInstructions.shift()
    const newInstructions = travelLight(layout, tile, direction)
    nextInstructions.push(...newInstructions)
  }
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
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
