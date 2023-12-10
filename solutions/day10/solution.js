const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const directions = {
  UP: { name: 'up', x: 0, y: -1 },
  DOWN: { name: 'down', x: 0, y: 1 },
  LEFT: { name: 'left', x: -1, y: 0 },
  RIGHT: { name: 'right', x: 1, y: 0 }
}

const pipeTypes = {
  '-': { exits: [directions.LEFT, directions.RIGHT], name: 'horizontal' },
  '|': { exits: [directions.UP, directions.DOWN], name: 'vertical' },
  F: { exits: [directions.RIGHT, directions.DOWN], name: 'F corner' },
  7: { exits: [directions.LEFT, directions.DOWN], name: '7 corner' },
  L: { exits: [directions.UP, directions.RIGHT], name: 'L corner' },
  J: { exits: [directions.UP, directions.LEFT], name: 'J corner' },
  '.': { exits: [], name: 'floor' },
  '?': { exits: [], name: 'unknown' }
}

function parsePipeMap (input) {
  const pipeMap = {
    locations: {},
    pipes: []
  }
  pipeMap.pipes = input.split('\n').map(line => line.trim()).filter(line => line.length > 0).forEach((line, y) => {
    const row = line.split('').map((char, x) => {
      const pipe = pipeTypes[char] ?? pipeTypes['?']
      pipeMap.locations[`${x},${y}`] = pipe
      return pipe
    })
    return row
  })
  return pipeMap
}

async function solveForFirstStar (input) {
  const pipeMap = parsePipeMap(input)

  await write(fromHere('output.json'), JSON.stringify(pipeMap, null, 2), 'utf8')

  const solution = 'UNSOLVED'
  report('Input:', input)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
