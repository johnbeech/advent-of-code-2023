const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseSprings (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  const springs = lines.map((line, index) => {
    const [conditions, checkString] = line.split(' ')
    const checks = checkString.split(',').map(check => Number.parseInt(check, 10))
    return [
      conditions,
      checks
    ]
  })
  return springs
}

function countArrangements (inputs, index) {
  const [[curr, ...rest], checks] = inputs
  if (!curr) {
    return (checks.length === 1 && checks[0] === index) ||
      (!checks.length && !index)
      ? 1
      : 0
  }
  return [...(curr === '?' ? '.#' : curr)]
    .map(c => {
      if (c === '#') { return countArrangements([rest, checks], index + 1) }
      // if no new group yet, keep moving
      if (!index) return countArrangements([rest, checks], 0)
      // if we started counting and count matches then check next portion
      if (index === checks[0]) { return countArrangements([rest, checks.slice(1)], 0) }
      // no match
      return 0
    })
    .reduce((sum, v) => sum + v, 0)
}

async function solveForFirstStar (input) {
  const springs = parseSprings(input)

  const arrangements = springs.map(spring => countArrangements(spring, 0))
  const sumOfArrangements = arrangements.reduce((sum, v) => sum + v, 0)

  await write(fromHere('springs.json'), JSON.stringify(springs, null, 2), 'utf8')

  const solution = sumOfArrangements
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
