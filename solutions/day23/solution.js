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
  N: { x: 0, y: -1, slope: '^' },
  S: { x: 0, y: 1, slope: 'v' },
  E: { x: 1, y: 0, slope: '>' },
  W: { x: -1, y: 0, slope: '<' }
}
const neighbors = Object.values(directions)
const slopeChars = Object.values(directions).map(({ slope }) => slope)

function parseForestMap (input) {
  const forestMap = input.split('\n').map((line, y) => line.split('').map((char, x) => {
    return { x, y, char }
  }))

  forestMap.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell.char === '#') {
        return
      }
      const slope = neighbors.find(({ slope }) => slope === cell.char)
      if (slope) {
        cell.neighbors = [{ x: x + slope.x, y: y + slope.y }]
      } else {
        cell.neighbors = neighbors.map((dir) => ({ x: x + dir.x, y: y + dir.y, dir })).filter((coord) => {
          const tile = forestMap[coord.y]?.[coord.x]
          if (tile === undefined) {
            return false
          } else if (tile.char === '#') {
            return false
          } else if (tile.char === '.') {
            return true
          } else if (slopeChars.includes(tile.char)) {
            console.log('Found slope neighbor:', tile, 'from', cell)
            const slope = neighbors.find(({ slope }) => slope === tile.char)
            return slope === coord.dir
          } else {
            throw new Error('Unrecognised neighbouring tile symbol:', tile.char, { tile }, 'at', { cell })
          }
        })
      }
    })
  })
  const width = forestMap[0].width
  const height = forestMap.length

  const entryTile = forestMap[0].find(tile => tile.char === '.')
  const exitTile = forestMap[forestMap.length - 1].find(tile => tile.char === '.')

  return {
    forestMap,
    entryTile,
    exitTile,
    size: {
      width,
      height
    }
  }
}

async function solveForFirstStar (input) {
  const { forestMap, entryTile, exitTile } = parseForestMap(input)

  console.log('Entry:', entryTile)
  console.log('Exit', exitTile)

  await write(fromHere('forest-map.json'), JSON.stringify(forestMap, null, 2), 'utf8')

  const paths = []
  const open = []
  // Walk all possible paths; entering each tile only once
  open.push({ path: [entryTile], tile: entryTile })
  let steps = 0
  while (open.length > 0) {
    const { path, tile } = open.shift()
    if (tile === exitTile) {
      paths.push(path)
    }
    tile.neighbors.forEach(coord => {
      const neighbor = forestMap[coord.y]?.[coord.x]
      if (!path.includes(neighbor)) {
        open.push({ path: [...path, neighbor], tile: neighbor })
      }
    })
    if (steps % 1000 === 0) {
      console.log('Step', steps, 'Open', open.length, 'Paths', paths.length)
    }
    steps++
  }

  paths.sort((a, b) => b.length - a.length)
  console.log('Paths', paths.length, paths.map(path => path.length - 1), 'Steps', steps)

  const longestPath = paths[0]
  const longestDisplayMap = displayMap(forestMap, longestPath)
  await write(fromHere('solution1-map.txt'), longestDisplayMap, 'utf8')

  const solution = longestPath.length - 1
  report('Solution 1:', solution)
}

function clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function displayMap (forestMap, path) {
  const copy = clone(forestMap.map(row => row.map(cell => cell.char)))
  path.forEach(({ x, y }) => {
    copy[y][x] = 'O'
  })
  return copy.map(row => row.join('')).join('\n')
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
