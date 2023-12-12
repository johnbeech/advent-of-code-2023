const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('example.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseSprings (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  const springs = lines.map((line, index) => {
    const [conditionString, checkString] = line.split(' ')
    const conditions = conditionString.split('')
    const checks = checkString.split(',').map(check => Number.parseInt(check, 10))
    return {
      index,
      conditions,
      checks
    }
  })
  return springs
}

async function solveForFirstStar (input) {
  const springs = parseSprings(input)

  await write(fromHere('springs.json'), JSON.stringify(springs, null, 2), 'utf8')

  const solution = 'UNSOLVED'
  report('Input:', input)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
