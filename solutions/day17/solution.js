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
  down: { x: 0, y: 1 },
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  up: { x: 0, y: -1 }
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
    block.nhl = block.neighbors.reduce((acc, neighbor) => acc + neighbor.val, 0)
    return block
  }))

  return remapped
}

function findPath (start, end) {
  const openSet = [start]
  const closedSet = []
  const cameFrom = {}

  const gScore = {}

  gScore[start.x + ',' + start.y] = 0

  while (openSet.length > 0) {
    openSet.sort((a, b) => gScore[a.x + ',' + a.y] - gScore[b.x + ',' + b.y])

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
      if (!neighbor || closedSet.some(c => c.x === neighbor.x && c.y === neighbor.y)) {
        continue
      }

      const cx = current.x
      const parent = cameFrom[current.x + ',' + current.y]
      const grandParent = parent && cameFrom[parent.x + ',' + parent.y]
      const greatGrandParent = grandParent && cameFrom[grandParent.x + ',' + grandParent.y]
      if (
        parent?.x === cx &&
        grandParent?.x === cx &&
        greatGrandParent?.x === cx &&
        neighbor.x === cx
      ) {
        console.log('Can not move in the same X direction a fourth time')
        continue
      }

      const cy = current.y
      if (
        parent?.y === cy &&
        grandParent?.y === cy &&
        greatGrandParent?.y === cy &&
        neighbor.y === cy
      ) {
        console.log('Can not move in the same Y direction a fourth time')
        continue
      }

      const tentativeGScore = gScore[current.x + ',' + current.y] + neighbor.val

      const neighborKey = neighbor.x + ',' + neighbor.y

      if (!openSet.some(o => o.x === neighbor.x && o.y === neighbor.y) || tentativeGScore < gScore[neighborKey]) {
        cameFrom[neighborKey] = current
        gScore[neighborKey] = tentativeGScore

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
      return block.val
    }
    return '.' // block.val
  }).join('')).join('\n')
  console.log(lines)
}

async function solveForFirstStar (input) {
  const city = parseCityBlocks(input)
  const start = city[0][1]
  const end = city[city.length - 1][city[0].length - 1]

  const path = findPath(start, end, city)
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
