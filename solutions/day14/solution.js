const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

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

function rollUp (puzzle) {
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
}

async function solveForFirstStar (input) {
  const puzzle = parseInput(input)

  rollUp(puzzle)

  const northLoad = puzzle.map.reduce((acc, row, rowIndex) => {
    const roundRocks = row.filter(char => char === 'O').length
    const load = (puzzle.height - rowIndex) * roundRocks
    return acc + load
  }, 0)

  const solution = northLoad
  report('Puzzle:', puzzle)
  console.log(puzzle.map.map(line => line.join('')).join('\n'))
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
