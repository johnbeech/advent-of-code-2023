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
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 }
}
const neighbors = Object.values(directions)

function parseCityBlocks (input) {
  const blocks = input.split('\n').map((line, y) => line.split('').map((char, x) => {
    return {
      x,
      y,
      val: Number.parseInt(char)
    }
  }))

  const remapped = blocks.map(row => row.map(block => {
    block.neighbors = neighbors.map(dir => blocks[block.y + dir.y] && blocks[block.y + dir.y][block.x + dir.x]).filter(block => block !== undefined)
    return block
  }))

  return remapped
}

function heuristic (a, b, blocks) {
  // Euclidean distance as the heuristic
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  const baseHeuristic = Math.sqrt(dx * dx + dy * dy) * 0.01
  const heatLoss = (blocks[a.x][a.y].val)
  return baseHeuristic + heatLoss
}

function findPath (start, end, blocks) {
  const openSet = [start]
  const closedSet = []
  const cameFrom = {}

  const gScore = {}
  const fScore = {}

  gScore[start.x + ',' + start.y] = 0
  fScore[start.x + ',' + start.y] = heuristic(start, end, blocks)

  while (openSet.length > 0) {
    openSet.sort((a, b) => fScore[a.x + ',' + a.y] - fScore[b.x + ',' + b.y])
    let current = openSet.shift()

    if (current.x === end.x && current.y === end.y) {
      // Reconstruct path
      const path = [current]
      while (cameFrom[current.x + ',' + current.y]) {
        path.unshift(cameFrom[current.x + ',' + current.y])
        current = cameFrom[current.x + ',' + current.y]
      }
      return path
    }

    closedSet.push(current)

    for (const neighbor of current.neighbors) {
      if (!neighbor || closedSet.some(c => c.x === neighbor.x && c.y === neighbor.y) || neighbor.val > 9) {
        continue
      }

      const cx = current.x
      const parent = cameFrom[current.x + ',' + current.y]
      const grandParent = parent && cameFrom[parent.x + ',' + parent.y]
      if (parent?.x === cx && grandParent?.x === cx && neighbor.x === cx) {
        console.log('Can not move in same X direction a fourth time')
        continue
      }

      const cy = current.y
      if (parent?.y === cy && grandParent?.y === cy && neighbor.y === cy) {
        console.log('Can not move in same Y direction a fourth time')
        continue
      }

      const heatLoss = neighbor.val
      const tentativeGScore = gScore[current.x + ',' + current.y] + heatLoss

      const neighborKey = neighbor.x + ',' + neighbor.y

      if (!openSet.some(o => o.x === neighbor.x && o.y === neighbor.y) || tentativeGScore < gScore[neighborKey]) {
        cameFrom[neighborKey] = current
        gScore[neighborKey] = tentativeGScore
        fScore[neighborKey] = gScore[neighborKey] + heuristic(neighbor, end, blocks)

        if (!openSet.some(o => o.x === neighbor.x && o.y === neighbor.y)) {
          openSet.push(neighbor)
        }
      }
    }
  }

  // No path found
  return null
}

function displayCity (city, path) {
  const lines = city.map(row => row.map(block => {
    if (path.some(p => p.x === block.x && p.y === block.y)) {
      return '#'
    }
    return '.'
  }).join('')).join('\n')
  console.log(lines)
}

async function solveForFirstStar (input) {
  const city = parseCityBlocks(input)
  const start = city[0][0]
  const end = city[city.length - 1][city[0].length - 1]

  const path = findPath(end, start, city)
  const pathScore = path.reduce((acc, block) => acc + block.val, 0)

  const solution = pathScore

  displayCity(city, path)

  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
