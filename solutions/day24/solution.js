const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseNumberLine (line) {
  const [x, y, z, vx, vy, vz] = line.match(/-?\d+/g).map(Number)
  return { x, y, z, vx, vy, vz }
}

function parseDataFromInput (input) {
  return input.split('\n')
    .map(n => n.trim())
    .filter(n => n)
    .map(parseNumberLine)
}

function intersect (x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (denom === 0) {
    return null
  }
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  return {
    x: x1 + ua * (x2 - x1),
    y: y1 + ua * (y2 - y1)
  }
}

function pair (items, cb) {
  const pairs = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([items[i], items[j]])
    }
  }
  return pairs
}

async function solveForFirstStar (input) {
  const data = parseDataFromInput(input)
  const MIN = data.length < 20 ? 7 : 200000000000000
  const MAX = data.length < 20 ? 27 : 400000000000000

  let intersections = 0
  pair(data).forEach(([dp1, dp2]) => {
    const x1 = dp1.x
    const y1 = dp1.y
    const x2 = dp1.vx + dp1.x
    const y2 = dp1.vy + dp1.y
    const x3 = dp2.x
    const y3 = dp2.y
    const x4 = dp2.vx + dp2.x
    const y4 = dp2.vy + dp2.y

    const intersection = intersect(x1, y1, x2, y2, x3, y3, x4, y4)
    if (intersection) {
      const x = intersection.x
      const y = intersection.y

      const inFuture = (x > x1) === (x2 - x1 > 0) &&
        (y > y1) === (y2 - y1 > 0) &&
        (x > x3) === (x4 - x3 > 0) &&
        (y > y3) === (y4 - y3 > 0)
      const inTestArea = (x >= MIN) && (x <= MAX) && (y >= MIN) && (y <= MAX)
      if (inFuture && inTestArea) {
        intersections++
      }
    }
  })

  const solution = intersections
  report('Input:', data)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = null
  report('Solution 2:', solution)
}

run()
