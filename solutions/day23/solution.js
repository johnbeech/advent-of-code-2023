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
  N: { x: 0, y: -1, slope: '^' },
  S: { x: 0, y: 1, slope: 'v' },
  E: { x: 1, y: 0, slope: '>' },
  W: { x: -1, y: 0, slope: '<' }
}
const neighbors = Object.values(directions)
const slopeChars = Object.values(directions).map(({ slope }) => slope)

function parseForestMap (input) {
  const forestMap = input.split('\n').map((line, y) => line.split('').map((char, x) => {
    return { x, y, char }
  }))

  forestMap.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell.char === '#') {
        return
      }
      const slope = neighbors.find(({ slope }) => slope === cell.char)
      if (slope) {
        cell.neighbors = [{ x: x + slope.x, y: y + slope.y }]
      } else {
        cell.neighbors = neighbors.map((dir) => ({ x: x + dir.x, y: y + dir.y, dir })).filter((coord) => {
          const tile = forestMap[coord.y]?.[coord.x]
          if (tile === undefined) {
            return false
          } else if (tile.char === '#') {
            return false
          } else if (tile.char === '.') {
            return true
          } else if (slopeChars.includes(tile.char)) {
            // console.log('Found slope neighbor:', tile, 'from', cell)
            const slope = neighbors.find(({ slope }) => slope === tile.char)
            return slope === coord.dir
          } else {
            throw new Error('Unrecognised neighbouring tile symbol:', tile.char, { tile }, 'at', { cell })
          }
        })
      }
    })
  })
  const width = forestMap[0].width
  const height = forestMap.length

  const entryTile = forestMap[0].find(tile => tile.char === '.')
  const exitTile = forestMap[forestMap.length - 1].find(tile => tile.char === '.')

  return {
    forestMap,
    entryTile,
    exitTile,
    size: {
      width,
      height
    }
  }
}

function findAllPaths (forestMap, start, end) {
  const longestPath = []
  const open = []
  // Walk all possible paths; entering each tile only once
  open.push({ path: [start], tile: start })
  let steps = 0
  while (open.length > 0) {
    const { path, tile } = open.shift()
    if (tile === end) {
      if (path.length > longestPath.length) {
        longestPath.length = 0
        longestPath.push(...path)
      }
    }
    tile.neighbors.forEach(coord => {
      const neighbor = forestMap[coord.y]?.[coord.x]
      if (!path.includes(neighbor)) {
        open.push({ path: [...path, neighbor], tile: neighbor })
      }
    })
    if (steps % 10000 === 0) {
      console.log('Find step', steps, 'Open', open.length, 'Longest path', longestPath.length)
    }
    steps++
  }

  return longestPath
}

function connectToJunction (node, nodes) {
  // try to locate existing one
  let jncId = nodes.findIndex(n => n.p[0] === node.p[0] && n.p[1] === node.p[1])

  if (jncId === node.lastJncId) {
    return jncId
  }

  if (jncId === -1) {
    jncId = nodes.push({ p: node.p.slice(), connections: [] }) - 1
  }

  // we need to connect cur.lastJuncId and newJuncId
  if (nodes[node.lastJncId].connections.findIndex(conn => conn.id === jncId) === -1) {
    nodes[node.lastJncId].connections.push({
      id: jncId,
      distance: node.steps - node.stepsToLastJnc
    })
  }

  if (nodes[jncId].connections.findIndex(conn => conn.id === node.lastJncId) === -1) {
    nodes[jncId].connections.push({
      id: node.lastJncId,
      distance: node.steps - node.stepsToLastJnc
    })
  }

  return jncId
}

function key (p) {
  return p[0] + '_' + p[1]
}

function addVect (a, b) {
  return a.map((v, c) => v + b[c])
}

function validPos (p, forestMap) {
  return forestMap[p[1]] !== undefined && forestMap[p[1]][p[0]] !== undefined && forestMap[p[1]][p[0]] !== '#'
}

function getGraph (startPos, endPos, forestMap) {
  const open = [{ p: startPos.slice(), steps: 0, lastJncId: 0, stepsToLastJnc: 0 }]
  const nodes = [{ p: [1, 0], connections: [] }]
  const visited = {}
  let steps = 0

  while (open.length) {
    steps++
    if (steps % 1000 === 0) {
      console.log('Graph step', steps, 'Open', open.length, 'Nodes', nodes.length)
    }
    const node = open.pop()
    const k = key(node.p)
    const moves = neighbors.map(dir => addVect(node.p, [dir.x, dir.y])).filter(pos => validPos(pos, forestMap))

    if (moves.length > 2) {
      node.lastJncId = connectToJunction(node, nodes)
      node.stepsToLastJnc = node.steps
    }

    if (visited[k] !== undefined) {
      continue
    }
    visited[k] = 1

    if (node.p[0] === endPos[0] && node.p[1] === endPos[1]) {
      connectToJunction(node, nodes)
      continue
    }

    moves.forEach(np => open.push({
      p: np,
      steps: node.steps + 1,
      lastJncId: node.lastJncId,
      stepsToLastJnc: node.stepsToLastJnc
    }))
  }

  return nodes
}

async function solveForFirstStar (input) {
  const { forestMap, entryTile, exitTile } = parseForestMap(input)

  console.log('Entry:', entryTile)
  console.log('Exit', exitTile)

  await write(fromHere('forest-map.json'), JSON.stringify(forestMap, null, 2), 'utf8')

  const longestPath = findAllPaths(forestMap, entryTile, exitTile)

  const longestDisplayMap = displayMap(forestMap, longestPath)
  await write(fromHere('solution1-map.txt'), longestDisplayMap, 'utf8')

  const solution = longestPath.length - 1
  report('Solution 1:', solution)
}

function clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function displayMap (forestMap, path) {
  const copy = clone(forestMap.map(row => row.map(cell => cell.char)))
  path.forEach(({ x, y }) => {
    copy[y][x] = 'O'
  })
  return copy.map(row => row.join('')).join('\n')
}

async function solveForSecondStar (input) {
  // Adapted from https://github.com/surgi1/adventofcode/blob/main/2023/day23/script.js
  const forestMap = input.split('\n').map((line, y) => line.split(''))
  const startPos = [1, 0]
  const endPos = [forestMap[0].length - 2, forestMap.length - 1]

  const nodes = getGraph(startPos, endPos, forestMap)

  await write(fromHere('graph.json'), JSON.stringify(nodes, null, 2), 'utf8')

  const stack = [{ p: 0, steps: 0, seen: {} }]
  const endNodeId = nodes.length - 1
  let maxSteps = 0

  let steps = 0
  while (stack.length) {
    steps++
    if (steps % 100000 === 0) {
      console.log('Search step', steps, 'Stack', stack.length)
    }
    const cur = stack.pop()

    const k = cur.p
    cur.seen[k] = 1

    if (cur.p === endNodeId) {
      maxSteps = Math.max(cur.steps, maxSteps)
      continue
    }

    nodes[k].connections.filter(n => cur.seen[n.id] === undefined).forEach(n => stack.push({
      p: n.id,
      steps: cur.steps + n.distance,
      seen: { ...cur.seen }
    }))
  }

  const solution = maxSteps
  report('Solution 2:', solution)
}

run()
