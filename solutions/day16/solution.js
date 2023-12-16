const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('example.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
}

const mirrors = {
  '/': {
    right: ['up'],
    left: ['down'],
    up: ['right'],
    down: ['left']
  },
  '\\': {
    right: ['down'],
    left: ['up'],
    up: ['left'],
    down: ['right']
  },
  '-': {
    right: ['right'],
    left: ['left'],
    up: ['left', 'right'],
    down: ['left', 'right']
  },
  '|': {
    right: ['up', 'down'],
    left: ['up', 'down'],
    up: ['up'],
    down: ['down']
  }
}

function createTile (char, x, y) {
  const empty = char === '.'
  const mirror = mirrors[char]
  return {
    char,
    mirror,
    x,
    y,
    empty,
    energised: {
      up: 0,
      down: 0,
      left: 0,
      right: 0
    }
  }
}

function parseMirrorLayout (input) {
  const layout = []
  input.split('\n').forEach((line, y) => {
    const row = line.split('').map((char, x) => createTile(char, x, y))
    layout.push(row)
  })
  return layout
}

async function solveForFirstStar (input) {
  const layout = parseMirrorLayout(input)

  console.log('Directions', directions)

  const solution = 'UNSOLVED'
  report('Mirrors:', layout)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
