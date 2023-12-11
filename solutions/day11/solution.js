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
        x, y, symbol: char, num: galaxies.length
      }
      locations[`${x},${y}`] = location
      galaxies.push(location)
    })
    return locations
  }, {})
  return {
    locations,
    width: lines[0].length,
    height: lines.length,
    list: galaxies
  }
}

function createSequence (length) {
  return Array.from({ length }, (_, i) => i)
}

async function solveForFirstStar (input) {
  const galaxies = parseGalaxies(input)
  const solution = 'UNSOLVED'

  const rowsWithoutGalaxies = createSequence(galaxies.height).map(y => {
    const expandRow = galaxies.list.every(location => !location.y === y)
    const expansion = expandRow ? 1 : 2
    return { y, expansion }
  })
  const columnsWithoutGalaxies = createSequence(galaxies.width).map(x => {
    const expandColumn = galaxies.list.every(location => !location.x === x)
    const expansion = expandColumn ? 1 : 2
    return { x, expansion }
  })

  await write(fromHere('output.json'), JSON.stringify({ rowsWithoutGalaxies, columnsWithoutGalaxies, galaxies }, null, 2), 'utf8')

  report('Input:', input)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
