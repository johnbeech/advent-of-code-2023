const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

function parseAlamac (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  const seeds = lines.shift().split(':')[1].trim().split(' ').map(Number)

  const testLine = /([A-z-]+) map:/
  const maps = lines.reduce((acc, line) => {
    const mapName = testLine.exec(line)?.[1]
    if (mapName) {
      const [source, destination] = mapName.split('-to-')
      acc[mapName] = {
        name: mapName,
        source: source.trim(),
        destination: destination.trim(),
        items: []
      }
      acc.currentMap = mapName
    } else {
      const [destinationRangeStart, sourceRangeStart, rangeLength] = line.split(' ').map(Number)
      acc[acc.currentMap].items.push({
        destinationRangeStart,
        sourceRangeStart,
        rangeLength
      })
    }
    return acc
  }, {})

  delete maps.currentMap

  return {
    seeds,
    maps
  }
}

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

async function solveForFirstStar (input) {
  const alamac = parseAlamac(input)

  await write(fromHere('alamac.json'), JSON.stringify(alamac, null, 2), 'utf8')

  const solution = 'UNSOLVED'
  report('Input:', input)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
