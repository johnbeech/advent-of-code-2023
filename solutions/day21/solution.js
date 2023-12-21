const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('example.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const directions = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 }
}

const neighbors = Object.values(directions)

function parseGardenMap (input) {
  const gardenMap = input.split('\n').map((line, y) => {
    return line.split('').map((char, x) => {
      return {
        char, x, y
      }
    })
  })
  const gardenTiles = gardenMap.flat(2).map(tile => {
    tile.neighbors = neighbors.map(direction => {
      const neighbor = gardenMap[tile.y + direction.y]?.[tile.x + direction.x]
      return neighbor
    }).filter(neighbor => neighbor)
    return tile
  })
  const startTile = gardenTiles.find(tile => tile.char === 'S')
  return {
    gardenMap,
    gardenTiles,
    width: gardenMap[0].length,
    height: gardenMap.length,
    startTile
  }
}

function displayGardenMap (gardenMap) {
  return gardenMap.map(line => line.map(tile => tile.char).join('')).join('\n')
}

async function solveForFirstStar (input) {
  const { gardenMap, gardenTiles, width, height, startTile } = parseGardenMap(input)

  console.log({ gardenMap, gardenTiles, width, height, startTile })

  console.log(displayGardenMap(gardenMap))

  const solution = 'UNSOLVED'
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
