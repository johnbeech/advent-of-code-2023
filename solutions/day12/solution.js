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

function memoize (func) {
  const cacheSet = new Set()
  const cache = {}

  return function (...args) {
    const key = args.join(',')

    if (!cacheSet.has(key)) {
      cacheSet.add(key)
      cache[key] = func.apply(this, args)
    }

    return cache[key]
  }
}

let iterations = 0
function _countArrangements (inputs, index) {
  iterations++
  if (iterations % 1000000 === 0) {
    console.log('Iterations', iterations)
  }
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

const countArrangements = memoize(_countArrangements)

async function solveForFirstStar (input) {
  const springs = parseSprings(input)

  const arrangements = springs.map(spring => countArrangements(spring, 0))
  const sumOfArrangements = arrangements.reduce((sum, v) => sum + v, 0)

  await write(fromHere('springs.json'), JSON.stringify(springs, null, 2), 'utf8')

  const solution = sumOfArrangements
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const springs = parseSprings(input)

  const unfurledSprings = springs.map(spring => {
    const [conditions, checks] = spring
    return [
      '?????'.split('').map(c => conditions).join('?'),
      '12345'.split('').map(c => checks).flat()
    ]
  })

  const arrangements = unfurledSprings.map((spring, index) => {
    console.log('Spring', (index + 1), spring[0], spring[1].join(', '))
    const count = countArrangements(spring, 0)
    console.log({ count, iterations })
    iterations = 0
    return count
  })
  const sumOfArrangements = arrangements.reduce((sum, v) => sum + v, 0)

  const solution = sumOfArrangements
  report('Solution 2:', solution)
}

run()
