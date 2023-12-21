const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

/**
 * Solution adapted from: scibuff's solution
 * Reddit: https://www.reddit.com/r/adventofcode/comments/18nevo3/comment/keb6a53/
 * Part 1: https://pastebin.com/d6PqqBeQ
 * Part 2: https://pastebin.com/d0tD8Uwx
 * Parser: https://pastebin.com/FUuHM87u
 */

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  console.time('Part 1')
  const solution1 = await countSteps(input)
  report('Solution 1:', solution1)
  console.timeEnd('Part 1')

  console.time('Part 2')
  const solution2 = await countPolynomialSteps(input)
  report('Solution 2:', solution2)
  console.timeEnd('Part 2')
}

function wrapped (i, j, size) {
  i %= size
  j %= size
  return {
    wi: i >= 0 ? i : size + i,
    wj: j >= 0 ? j : size + j
  }
}

function key (...args) {
  return args.join(',')
}

function parseGardenMap (input) {
  const grid = input.split('\n').filter(n => n).map((e) => e.trim().split(''))
  const walls = {}
  const plots = {}
  let start = { i: 0, j: 0 }
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const value = grid[i][j]
      if (value === '#') {
        walls[key(i, j)] = true
      }
      if (value === 'S') {
        plots[key(i, j)] = -1
        start = { x: i, y: j }
      }
    }
  }
  return {
    walls,
    plots,
    start,
    size: grid.length
  }
}

const directions = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 }
]

function getNextSteps (grid, x, y, stepCount) {
  const k = key(x, y)
  const { wi, wj } = wrapped(x, y, grid.size)
  const wk = key(wi, wj)

  if (grid.walls[wk] || grid.plots[k] >= stepCount) {
    return []
  }
  grid.plots[k] = stepCount
  if (stepCount > 0) {
    const dist = stepCount - 1
    return directions.map(dir => {
      return {
        x: x + dir.x,
        y: y + dir.y,
        dist
      }
    })
  }
  return []
}

function countSteps (input, targetSteps = 64) {
  const grid = parseGardenMap(input)
  const queue = [
    {
      x: grid.start.x,
      y: grid.start.y,
      dist: targetSteps
    }
  ]
  while (queue.length > 0) {
    const step = queue.shift()
    queue.push(...getNextSteps(grid, step.x, step.y, step.dist))
  }
  return Object.values(grid.plots).filter((e) => e % 2 === 0).length
}

function simplifiedLagrange (values) {
  return {
    a: values[0] / 2 - values[1] + values[2] / 2,
    b: -3 * (values[0] / 2) + 2 * values[1] - values[2] / 2,
    c: values[0]
  }
}

function countPolynomialSteps (input) {
  const values = [countSteps(input, 65), countSteps(input, 65 + 131), countSteps(input, 65 + 131 * 2)]
  const poly = simplifiedLagrange(values)
  const target = (26_501_365 - 65) / 131
  return poly.a * target * target + poly.b * target + poly.c
}

run()
