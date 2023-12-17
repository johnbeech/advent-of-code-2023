const path = require('path')
const { read, position } = require('promise-path')
const { Heap } = require('heap-js')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const directions = {
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
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

class Visited {
  visited = new Set()
  minSteps = 0
  maxSteps = 0
  constructor (minSteps, maxSteps) {
    this.minSteps = minSteps
    this.maxSteps = maxSteps
  }

  check ({ row, col, rowDir, colDir, consecutive }) {
    const key =
      (row << 24) | (col << 16) | ((rowDir & 3) << 14) | ((colDir & 3) << 12) | consecutive
    if (this.visited.has(key)) return true
    if (consecutive >= this.minSteps) { for (let i = 0; i <= this.maxSteps - consecutive; ++i) this.visited.add(key + i) } else this.visited.add(key)
    return false
  }
}

function tryDirection (cityMap, positions,
  pos,
  rowDir,
  colDir,
  minSteps,
  maxSteps
) {
  const nextRow = pos.row + rowDir
  const nextCol = pos.col + colDir
  const sameDirection = rowDir === pos.rowDir && colDir === pos.colDir

  // Boundary check
  if (nextRow < 0 || nextRow >= cityMap.length || nextCol < 0 || nextCol >= cityMap[0].length) return
  // Backwards check
  if (rowDir === -pos.rowDir && colDir === -pos.colDir) return
  // Max steps check
  if (pos.consecutive === maxSteps && sameDirection) return
  // Min steps check
  if (pos.consecutive < minSteps && !sameDirection && !(pos.row === 0 && pos.col === 0)) return

  positions.push({
    row: nextRow,
    col: nextCol,
    rowDir,
    colDir,
    consecutive: sameDirection ? pos.consecutive + 1 : 1,
    heat: pos.heat + cityMap[nextRow][nextCol].val
  })
}

function minHeat (cityMap, minSteps, maxSteps) {
  const positions = new Heap((a, b) => a.heat - b.heat)
  const visited = new Visited(minSteps, maxSteps)
  positions.push({ row: 0, col: 0, rowDir: 0, colDir: 0, consecutive: 0, heat: 0 })
  while (positions.length > 0) {
    const pos = positions.pop()
    if (visited.check(pos)) {
      continue
    }
    if (pos.row === cityMap.length - 1 && pos.col === cityMap[0].length - 1 && pos.consecutive >= minSteps) {
      return pos.heat
    }
    for (const direction in directions) {
      tryDirection(cityMap, positions, pos, directions[direction].x, directions[direction].y, minSteps, maxSteps)
    }
  }
  throw new Error("Didn't find anything :(")
}

async function solveForFirstStar (input) {
  const cityMap = parseCityBlocks(input)
  const solution = minHeat(cityMap, 0, 3)

  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
