const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseGalaxies (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const galaxies = []
  const locations = lines.reduce((locations, line, y) => {
    line.split('').forEach((char, x) => {
      if (char === '.') {
        return
      }
      const location = {
        x, y, symbol: char, num: galaxies.length + 1
      }
      locations[`${x},${y}`] = location
      galaxies.push(location)
    })
    return locations
  }, {})
  const pairs = galaxies.reduce((acc, galaxy, index) => {
    while (index < galaxies.length - 1) {
      const other = galaxies[++index]
      acc.push([galaxy, other])
    }
    return acc
  }, [])
  return {
    locations,
    width: lines[0].length,
    height: lines.length,
    list: galaxies,
    pairs
  }
}

function createSequence (length) {
  return Array.from({ length }, (_, i) => i)
}

function findDistance (a, b, rowExpansion, columnExpansion) {
  const rowsCrossed = rowExpansion.slice(Math.min(a.y, b.y), Math.max(a.y, b.y))
  const columnsCrossed = columnExpansion.slice(Math.min(a.x, b.x), Math.max(a.x, b.x))

  const rowDistance = rowsCrossed.reduce((acc, { expansion }) => acc + expansion, 0)
  const columnDistance = columnsCrossed.reduce((acc, { expansion }) => acc + expansion, 0)
  return { a, b, distance: rowDistance + columnDistance, rowsCrossed: rowsCrossed.map(n => n.expansion), columnsCrossed: columnsCrossed.map(n => n.expansion) }
}

async function solveForFirstStar (input) {
  const galaxies = parseGalaxies(input)

  const rowExpansion = createSequence(galaxies.height).map(y => {
    const expandRow = !galaxies.list.some(location => location.y === y)
    const expansion = expandRow ? 2 : 1
    return { y, expansion }
  })
  const columnExpansion = createSequence(galaxies.width).map(x => {
    const expandColumn = !galaxies.list.some(location => location.x === x)
    const expansion = expandColumn ? 2 : 1
    return { x, expansion }
  })

  console.log('Pairs:', galaxies.pairs.length)
  const distances = galaxies.pairs.map(([a, b], index) => {
    return findDistance(a, b, rowExpansion, columnExpansion)
  })
  // console.log('Distances:', distances)

  const sumOfDistances = distances.reduce((acc, item) => acc + item.distance, 0)

  await write(fromHere('output.json'), JSON.stringify({ rowExpansion, columnExpansion, galaxies }, null, 2), 'utf8')

  const solution = sumOfDistances
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
