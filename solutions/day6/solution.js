const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('example.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseInput (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  const times = lines[0].split(':')[1].split(/\s+/g).map(n => parseInt(n, 10))
  const distances = lines[1].split(':')[1].split(/\s+/g).map(n => parseInt(n, 10))

  const pairs = times.map((time, index) => {
    return {
      time,
      distance: distances[index]
    }
  })

  return {
    times,
    distances,
    pairs
  }
}

async function solveForFirstStar (input) {
  const puzzle = parseInput(input)

  await write(fromHere('output.json'), JSON.stringify(puzzle, null, 2), 'utf8')

  const solution = 'UNSOLVED'
  report('Input:', input)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
