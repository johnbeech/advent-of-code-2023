const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseBlocks (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  return lines.map((line, index) => {
    const [start, end] = line.split('~')
    const [x1, y1, z1] = start.split(',').map(Number)
    const [x2, y2, z2] = end.split(',').map(Number)
    const topCorner = { x: Math.max(x1, x2), y: Math.max(y1, y2), z: Math.max(z1, z2) }
    const bottomCorner = { x: Math.min(x1, x2), y: Math.min(y1, y2), z: Math.min(z1, z2) }
    const volume = (topCorner.x - bottomCorner.x + 1) * (topCorner.y - bottomCorner.y + 1) * (topCorner.z - bottomCorner.z + 1)
    const id = String.fromCharCode(65 + (index % 26)) + Math.floor(index / 26 + 1)
    return {
      index,
      id,
      topCorner,
      bottomCorner,
      volume
    }
  })
}

function placeBlocks (blocks) {
  const computeSpace = {}
  blocks.forEach(block => {
    for (let x = block.bottomCorner.x; x <= block.topCorner.x; x++) {
      for (let y = block.bottomCorner.y; y <= block.topCorner.y; y++) {
        for (let z = block.bottomCorner.z; z <= block.topCorner.z; z++) {
          const key = `${x},${y},${z}`
          if (computeSpace[key]) {
            throw new Error(`Block ${block.id} overlaps with block ${computeSpace[key].id}`)
          }
          computeSpace[key] = block
        }
      }
    }
  })
  const xSize = Math.max(...blocks.map(block => block.topCorner.x))
  const ySize = Math.max(...blocks.map(block => block.topCorner.y))
  const zSize = Math.max(...blocks.map(block => block.topCorner.z))
  const floor = {
    id: '-',
    topCorner: { x: xSize, y: ySize, z: 0 },
    bottomCorner: { x: 0, y: 0, z: 0 },
    volume: xSize * ySize
  }
  computeSpace.find = (x, y, z) => {
    if (z === 0) {
      return floor
    }
    return computeSpace[`${x},${y},${z}`]
  }
  return {
    computeSpace,
    xSize,
    ySize,
    zSize
  }
}

function convertTo2d (slice, xSize, ySize, flipX = false) {
  const lines = []
  for (let y = 0; y <= ySize; y++) {
    const line = []
    for (let x = 0; x <= xSize; x++) {
      line.push(slice[`${x},${y}`] || '.')
    }
    const lineStr = flipX ? line.reverse().join('') : line.join('')
    lines.push(lineStr)
  }
  return lines.reverse().join('\n')
}

function renderFromTop (computeSpace, xSize, ySize, zSize, lastLayerOnly = false) {
  // render all layers from top to bottom
  const lines = []
  for (let z = zSize; z >= 0; z--) {
    const slice = {}
    for (let y = 0; y <= ySize; y++) {
      for (let x = 0; x <= xSize; x++) {
        const block = computeSpace.find(x, y, z)
        if (block) {
          slice[`${x},${y}`] = block.id[0]
        }
      }
    }
    if (lastLayerOnly && z !== zSize) {
      continue
    }
    lines.push(`z ${z}`)
    lines.push(convertTo2d(slice, xSize, ySize))
    lines.push('')
  }
  return lines.join('\n')
}

function renderFromFront (computeSpace, xSize, ySize, zSize) {
  const finalSlice = {}
  for (let y = 0; y <= ySize; y++) {
    for (let z = 0; z <= zSize; z++) {
      for (let x = 0; x <= xSize; x++) {
        const block = computeSpace.find(x, y, z)
        if (block && !finalSlice[`${x},${z}`]) {
          finalSlice[`${x},${z}`] = block.id[0]
        }
      }
    }
  }
  return convertTo2d(finalSlice, xSize, zSize)
}

function renderFromBack (computeSpace, xSize, ySize, zSize) {
  const finalSlice = {}
  for (let y = 0; y <= ySize; y++) {
    for (let z = zSize; z >= 0; z--) {
      for (let x = 0; x <= xSize; x++) {
        const block = computeSpace.find(x, y, z)
        if (block && !finalSlice[`${x},${z}`]) {
          finalSlice[`${x},${z}`] = block.id[0]
        }
      }
    }
  }
  return convertTo2d(finalSlice, xSize, zSize, true)
}

function renderFromSide (computeSpace, xSize, ySize, zSize) {
  const finalSlice = {}
  for (let x = 0; x <= xSize; x++) {
    for (let z = 0; z <= zSize; z++) {
      for (let y = 0; y <= ySize; y++) {
        const block = computeSpace.find(x, y, z)
        if (block && !finalSlice[`${y},${z}`]) {
          finalSlice[`${y},${z}`] = block.id[0]
        }
      }
    }
  }
  return convertTo2d(finalSlice, ySize, zSize)
}

function renderFromFarSide (computeSpace, xSize, ySize, zSize) {
  const finalSlice = {}
  for (let x = 0; x <= xSize; x++) {
    for (let z = zSize; z >= 0; z--) {
      for (let y = 0; y <= ySize; y++) {
        const block = computeSpace.find(x, y, z)
        if (block && !finalSlice[`${y},${z}`]) {
          finalSlice[`${y},${z}`] = block.id[0]
        }
      }
    }
  }
  return convertTo2d(finalSlice, ySize, zSize, true)
}

function printLinesSideBySide (...lineBlocks) {
  const lines = []
  const maxLines = Math.max(...lineBlocks.map(block => block.length))
  const maxLineLength = Math.max(...lineBlocks.map(block => block[1].length))
  for (let i = 0; i < maxLines; i++) {
    const line = lineBlocks.map(block => (block[i] ?? '').padEnd(maxLineLength + 2))
    lines.push(line.join(''))
  }
  return lines.join('\n')
}

async function solveForFirstStar (input) {
  const blocks = parseBlocks(input).sort((a, b) => a.bottomCorner.z - b.bottomCorner.z)

  const highestBlock = blocks[blocks.length - 1]
  const lowestBlock = blocks[0]

  const { computeSpace, xSize, ySize, zSize } = placeBlocks(blocks)

  console.log('Blocks:', blocks)
  console.log('Highest Block:', highestBlock)
  console.log('Lowest Block:', lowestBlock)

  console.log('Compute Space:', computeSpace)

  console.log('')
  console.log(printLinesSideBySide(
    ['Top', ...renderFromTop(computeSpace, xSize, ySize, zSize, true).split('\n')],
    ['FS', ...renderFromFront(computeSpace, xSize, ySize, zSize).split('\n')],
    ['LS ', ...renderFromSide(computeSpace, xSize, ySize, zSize).split('\n')],
    ['BS ', ...renderFromBack(computeSpace, xSize, ySize, zSize).split('\n')],
    ['RS ', ...renderFromFarSide(computeSpace, xSize, ySize, zSize).split('\n')]
  ))

  const solution = 'UNSOLVED'
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
