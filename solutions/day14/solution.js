const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('example.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseInput (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const map = lines.map(line => line.split(''))
  return {
    map,
    width: map[0].length,
    height: map.length,
    roundRocks: map.flat().filter(char => char === 'O').length,
    cubeRocks: map.flat().filter(char => char === '#').length
  }
}

function clone (puzzle) {
  return JSON.parse(JSON.stringify(puzzle))
}

function _rollNorth (puzzle) {
  console.log('Roll north')
  const { map, width, height } = puzzle
  for (let y = 0; y < height; y++) {
    const row = map[y]
    for (let x = 0; x < width; x++) {
      const char = row[x]
      if (char !== 'O') {
        continue
      }
      let j = 1
      let unstable = map[y - j]?.[x] === '.'
      while (unstable) {
        map[y - j][x] = 'O'
        map[y - j + 1][x] = '.'
        j++
        unstable = map[y - j]?.[x] === '.'
      }
    }
  }
  return puzzle
}

function _rollSouth (puzzle) {
  console.log('Roll south')
  const { map, width, height } = puzzle
  for (let y = height - 1; y >= 0; y--) {
    const row = map[y]
    for (let x = 0; x < width; x++) {
      const char = row[x]
      if (char !== 'O') {
        continue
      }
      let j = 1
      let unstable = map[y + j]?.[x] === '.'
      while (unstable) {
        map[y + j][x] = 'O'
        map[y + j - 1][x] = '.'
        j++
        unstable = map[y + j]?.[x] === '.'
      }
    }
  }
  return clone(puzzle)
}

function _rollWest (puzzle) {
  console.log('Roll west')
  const { map, width, height } = puzzle
  for (let y = 0; y < height; y++) {
    const row = map[y]
    for (let x = 0; x < width; x++) {
      const char = row[x]
      if (char !== 'O') {
        continue
      }
      let j = 1
      let unstable = map[y]?.[x - j] === '.'
      while (unstable) {
        map[y][x - j] = 'O'
        map[y][x - j + 1] = '.'
        j++
        unstable = map[y]?.[x - j] === '.'
      }
    }
  }
  return clone(puzzle)
}

function _rollEast (puzzle) {
  console.log('Roll east')
  const { map, width, height } = puzzle
  for (let y = 0; y < height; y++) {
    const row = map[y]
    for (let x = width - 1; x >= 0; x--) {
      const char = row[x]
      if (char !== 'O') {
        continue
      }
      let j = 1
      let unstable = map[y]?.[x + j] === '.'
      while (unstable) {
        map[y][x + j] = 'O'
        map[y][x + j - 1] = '.'
        j++
        unstable = map[y]?.[x + j] === '.'
      }
    }
  }
  return clone(puzzle)
}

function memoize (func) {
  const cacheSet = new Set()
  const cache = {}

  return function (...args) {
    const key = JSON.stringify(args)

    if (!cacheSet.has(key)) {
      cacheSet.add(key)
      cache[key] = func.apply(this, args)
    }

    return cache[key]
  }
}

const rollNorth = memoize(_rollNorth)
const rollSouth = memoize(_rollSouth)
const rollWest = memoize(_rollWest)
const rollEast = memoize(_rollEast)

const rollers = [
  rollNorth,
  rollWest,
  rollSouth,
  rollEast
]

function flattenResult (puzzle) {
  return puzzle.map.map(line => line.join('').replaceAll('.', '.')).join('\n') + '\n'
}

function displayResult (puzzle) {
  console.log(flattenResult(puzzle))
}

function _calculateNorthLoad (puzzle) {
  const { map, height } = puzzle
  const northLoad = map.reduce((acc, row, rowIndex) => {
    const roundRocks = row.filter(char => char === 'O').length
    const load = (height - rowIndex) * roundRocks
    return acc + load
  }, 0)
  return northLoad
}

const calculateNorthLoad = memoize(_calculateNorthLoad)

async function solveForFirstStar (input) {
  let puzzle = parseInput(input)
  puzzle = _rollNorth(puzzle)

  displayResult(puzzle)

  const solution = calculateNorthLoad(puzzle)
  report('Solution 1:', solution)
}

function _runCycle (puzzle) {
  rollers.forEach(rollFn => {
    puzzle = rollFn(clone(puzzle))
  })
  return puzzle
}

const runCycle = memoize(_runCycle)

async function solveForSecondStar (input) {
  let puzzle = parseInput(input)

  const solutions = {}
  let i = 0
  // 1000000000
  const limit = 1000000000
  while (i < limit) {
    puzzle = runCycle(puzzle)
    const solution = _calculateNorthLoad(puzzle)
    solutions[solution] = i
    if (i % 10000 === 0) {
      console.log('Solutions at', i, 'of', limit - i, ':', Object.entries(solutions)
        .map(([k, v]) => `${k}: ${v % 10000}`).join(', '))
      // displayResult(puzzle)
    }
    i++
  }

  const solution = _calculateNorthLoad(puzzle)
  report('Solution 2:', solution)
}

run()
