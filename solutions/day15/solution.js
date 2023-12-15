const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function hashFn (input) {
  let cur = 0
  for (let i = 0; i < input.length; i++) {
    cur += input.charCodeAt(i)
    cur *= 17
    cur = cur % 256
  }
  return cur
}

async function solveForFirstStar (input) {
  const blocks = input.split(',')

  const hashes = blocks.map(hashFn)
  const sumOfHashes = hashes.reduce((a, b) => a + b, 0)

  const solution = sumOfHashes
  report('Hashes:', hashes)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
