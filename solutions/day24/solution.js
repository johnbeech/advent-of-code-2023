const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseNumberLine (line, asArray = false) {
  const [x, y, z, vx, vy, vz] = line.match(/-?\d+/g).map(Number)
  if (asArray) {
    return [x, y, z, vx, vy, vz]
  }
  return { x, y, z, vx, vy, vz }
}

function parseDataFromInput (input, asArray = false) {
  return input.split('\n')
    .map(n => n.trim())
    .filter(n => n)
    .map(line => parseNumberLine(line, asArray))
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

function findLineLambda (a, b, c, d, p, q, r, s) {
  const det = (c - a) * (s - q) - (r - p) * (d - b)
  if (det === 0) return null
  return Math.round(((s - q) * (r - a) + (p - r) * (s - b)) / det)
}

function findIntersectionPoint (a, b, d1 = 0, d2 = 1) {
  const lambda = findLineLambda(
    a[d1], a[d2], a[d1] + a[d1 + 3], a[d2] + a[d2 + 3],
    b[d1], b[d2], b[d1] + b[d1 + 3], b[d2] + b[d2 + 3]
  )
  if (lambda === null) return null

  const f = a[d1] + lambda * a[d1 + 3]
  const g = a[d2] + lambda * a[d2 + 3]
  return [f, g]
}

function pair (items, cb) {
  if (typeof cb === 'function') {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        cb(items[i], items[j])
      }
    }
  } else {
    const pairs = []
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        pairs.push([items[i], items[j]])
      }
    }
    return pairs
  }
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

function findCommonIntersection (dataPoints, v, d1 = 0, d2 = 1) {
  let viable = true
  let current
  const transformed = dataPoints.map(dp => {
    const copy = [...dp]
    copy[d1 + 3] += v[0]
    copy[d2 + 3] += v[1]
    return copy
  })
  pair(transformed, (a, b) => {
    if (!viable) return false
    const point = findIntersectionPoint(a, b, d1, d2)
    if (point === null) return
    if (!current) current = point

    viable = point[0] === current[0] && point[1] === current[1]
  })
  if (!viable) {
    return false
  }
  return current
}

function solveForPart2 (dataPoints) {
  console.log('Data points to analyze:', dataPoints.length)
  let outerSteps = 0
  let innerSteps = 0
  for (let x = 0; x <= Infinity; x++) {
    for (let y = 0; y <= x; y++) {
      for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        outerSteps++
        if (outerSteps % 1000000 === 0) {
          report('Outer steps:', outerSteps)
        }
        // X and Y have an intersection
        const xy = findCommonIntersection(dataPoints, [x * sx, y * sy], 0, 1)
        if (!xy) continue

        for (let z = 0; z <= Infinity; z++) {
          for (const sz of [1, -1]) {
            innerSteps++
            if (innerSteps % 1000000 === 0) {
              report('Inner steps:', innerSteps)
            }
            // find intersection for X and Z, if it exists, it's the result
            const xz = findCommonIntersection(dataPoints, [x * sx, z * sz], 0, 2)
            if (!xz) continue
            return xy[0] + xy[1] + xz[1]
          }
        }
      }
    }
  }
}

async function solveForSecondStar (input) {
  const data = parseDataFromInput(input, true)
  const solution = solveForPart2(data.slice(0, 10))
  report('Solution 2:', solution)
}

run()
