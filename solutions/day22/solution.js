const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('example.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseBlocks (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  return lines.map((line, index) => {
    const [start, end] = line.split('~')
    const topLeft = start.split(',').map(Number)
    const bottomRight = end.split(',').map(Number)
    const volume = (bottomRight[0] - topLeft[0]) * (bottomRight[1] - topLeft[1])
    const id = String.fromCharCode(65 + (index % 26)) + Math.floor(index / 26 + 1)
    return {
      index,
      id,
      topLeft,
      bottomRight,
      volume
    }
  })
}

async function solveForFirstStar (input) {
  const blocks = parseBlocks(input)

  console.log('Blocks:', blocks)

  const solution = 'UNSOLVED'
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
