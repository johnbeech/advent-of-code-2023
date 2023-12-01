const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const namedDigits = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9
}

function parseCalibrationValueFrom (line) {
  const firstDigit = /^[A-z]*(\d)/.exec(line)?.[1] ?? 'x'
  let lastDigit = /[A-z\d]+(\d)[A-z]*$/.exec(line)?.[1] ?? 'x'
  if (firstDigit === 'x' && lastDigit === 'x') {
    console.error('Could not parse line', { firstDigit, lastDigit, line })
    return 0
  }
  if (lastDigit === 'x') {
    lastDigit = firstDigit
  }
  if (firstDigit === 'x') {
    console.error('Could not parse line', { firstDigit, lastDigit, line })
    return 0
  }
  return parseInt(firstDigit + lastDigit)
}

const namedEntries = Object.entries(namedDigits)

function replaceNumberWordsInString (str) {
  const source = str.split('')
  let forwardBuffer = ''
  let backwardsBuffer = ''
  while (source.length > 0) {
    forwardBuffer = forwardBuffer + source.shift()
    backwardsBuffer = (source.pop() ?? '') + backwardsBuffer
    namedEntries.forEach(([name, digit]) => {
      if (forwardBuffer.includes(name)) {
        forwardBuffer = forwardBuffer.replace(name, digit + name.charAt(name.length - 1))
      }
      if (backwardsBuffer.includes(name)) {
        backwardsBuffer = backwardsBuffer.replace(name, name.charAt(0) + digit)
      }
    })
  }
  let combinedBuffer = forwardBuffer + backwardsBuffer
  namedEntries.forEach(([name, digit]) => {
    if (combinedBuffer.includes(name)) {
      combinedBuffer = combinedBuffer.replace(name, digit)
    }
  })
  return combinedBuffer
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
  const lines = input.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  const replacedLines = lines
    .map(line => replaceNumberWordsInString(line))

  console.log('Replaced lines:', replacedLines)

  const calibrationValues = replacedLines
    .map(line => parseCalibrationValueFrom(line))

  console.log({ calibrationValues })

  const solution = calibrationValues.reduce((sum, line) => {
    return sum + parseCalibrationValueFrom(line)
  }, 0)

  report('Solution 2:', solution)
}

run()
