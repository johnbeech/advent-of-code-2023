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
  N: { x: 0, y: -1, d: 'N' },
  E: { x: 1, y: 0, d: 'E' },
  S: { x: 0, y: 1, d: 'S' },
  W: { x: -1, y: 0, d: 'W' }
}

const neighbors = Object.values(directions)

function parseGardenMap (input) {
  const gardenMap = input.split('\n').map((line, y) => {
    return line.split('').map((char, x) => {
      return {
        char,
        x,
        y,
        key: `${x},${y}`
      }
    })
  })
  const gardenTiles = gardenMap.flat(2)
  const startTile = gardenTiles.find(tile => tile.char === 'S')
  return {
    gardenMap,
    gardenTiles,
    width: gardenMap[0].length,
    height: gardenMap.length,
    startTile
  }
}

async function solveForFirstStar (input) {
  const { gardenMap, startTile } = parseGardenMap(input)

  let visited = new Set()
  let endTiles = [startTile]

  let counter = 0
  while (counter < 64) {
    const toExplore = endTiles
    endTiles = []
    visited = new Set()
    for (const { x, y } of toExplore) {
      for (const direction of neighbors) {
        const newx = x + direction.x
        const newy = y + direction.y
        const tile = gardenMap[newy][newx]
        if (tile.char !== '#' && !visited.has(tile)) {
          visited.add(tile)
          endTiles.push(tile)
        }
      }
    }

    counter++
  }

  const solution = endTiles.length
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
