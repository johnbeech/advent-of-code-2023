const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseMaps (input) {
  const lines = input.split('\n').map(line => line.trim())
  const maps = lines.reduce((acc, line) => {
    if (line.length === 0) {
      acc.push([])
    } else {
      acc[acc.length - 1].push(line)
    }
    return acc
  }, [[]])
  return maps
}

function tryAndMirror (map, type) {
  // move through each row index and try to find mirroring row position (if any)
  let i = 1
  while (i < map.length - 2) {
    const a = map.slice(0, i).join('')
    const b = map.slice(i).reverse().join('')
    if (a.length > b.length && a.endsWith(b)) {
      console.log(`Found ${type} mirror:`, i)
      return i
    } else if (b.length > a.length && b.endsWith(a)) {
      console.log(`Found mirror: ${type}`, i)
      return i
    }
    i++
  }
  // console.log({ i, a, b })
  console.log(`No ${type} mirror found`)
  return 0
}

function enhanceMap (horizontal, index) {
  // rotate map 90 degrees
  const vertical = horizontal[0].split('').map((_, i) => horizontal.map(row => row[i]).join(''))

  const horizontalMirror = tryAndMirror(horizontal, 'horizontal')
  const verticalMirror = tryAndMirror(vertical, 'vertical')

  if (horizontalMirror === 0 && verticalMirror === 0) {
    console.log(index, 'No mirror found', { horizontal, vertical })
  }

  return {
    horizontal,
    vertical,
    horizontalMirror,
    verticalMirror
  }
}

async function solveForFirstStar (input) {
  const maps = parseMaps(input).map(enhanceMap)

  const rowOffset = maps.reduce((acc, map) => acc + map.horizontalMirror, 0)
  const columnOffset = maps.reduce((acc, map) => acc + map.verticalMirror, 0)

  const noMirror = maps.filter(map => map.horizontalMirror === 0 && map.verticalMirror === 0)

  const solution = (rowOffset * 100) + columnOffset
  report('No mirrors:', noMirror.length)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
