const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseCalibrationValueFrom (line) {
  const firstDigit = /^[A-z]*(\d)/.exec(line)?.[1] ?? 'x'
  let lastDigit = /[A-z\d]+(\d)[A-z]*$/.exec(line)?.[1] ?? 'x'
  if (firstDigit === 'x' && lastDigit === 'x') {
    console.error('Could not parse line', { firstDigit, lastDigit, line })
    throw new Error('Could not parse line')
  }
  if (lastDigit === 'x') {
    lastDigit = firstDigit
  }
  if (firstDigit === 'x') {
    console.error('Could not parse line', { firstDigit, lastDigit, line })
    throw new Error('Could not parse line')
  }
  return parseInt(firstDigit + lastDigit)
}

async function solveForFirstStar (input) {
  const lines = input.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  const calibrationValues = lines
    .map(line => parseCalibrationValueFrom(line))

  console.log({ calibrationValues })

  const solution = calibrationValues.reduce((sum, line) => {
    return sum + parseCalibrationValueFrom(line)
  }, 0)

  // report('Input:', input)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
