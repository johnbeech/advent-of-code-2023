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

function tryAndMirror (map) {
  // move through each row index and try to find mirroring row position (if any)
  let i = 1
  while (i < map.length) {
    const a = map.slice(0, i).join('')
    const b = map.slice(i).reverse().join('')
    if (a.length > b.length && a.endsWith(b)) {
      // console.log(`Found ${type} mirror:`, i)
      // console.log(map.join('\n'))
      return i
    } else if (b.length > a.length && b.endsWith(a)) {
      // console.log(`Found mirror: ${type}`, i)
      // console.log(map.join('\n'))
      return i
    }
    i++
  }
  // console.log({ i, a, b })
  // console.log(`No ${type} mirror found`)
  return 0
}

function tryAndMirrorVariations (map, type) {
  const columns = map[0].length
  const rows = map.length
  const variations = columns * rows
  let i = 0
  // for each i; toggle a . to a #, or a # to a .
  const mirrors = new Set()
  while (i < variations) {
    const row = Math.floor(i / columns)
    const column = i % columns
    const originalLine = map[row]
    const line = map[row].split('')
    line[column] = line[column] === '.' ? '#' : '.'
    map[row] = line.join('')
    const mirror = tryAndMirror(map, type)
    map[row] = originalLine
    if (mirror > 0) {
      mirrors.add(mirror)
    }
    i++
  }
  console.log('Mirror sizes:', mirrors)
  return mirrors.size > 0 ? Math.min(...mirrors) : 0
}

function enhanceMap (horizontal, index, mirrorFn) {
  // rotate map 90 degrees
  const vertical = horizontal[0].split('').map((_, i) => horizontal.map(row => row[i]).join(''))

  let horizontalMirror = mirrorFn(horizontal, 'horizontal')
  let verticalMirror = mirrorFn(vertical, 'vertical')

  if (horizontalMirror === 0 && verticalMirror === 0) {
    console.log(index, 'No mirror found', { horizontal, vertical })
  }

  if (horizontalMirror > 0 && verticalMirror > 0) {
    console.log('More than one mirror found', { horizontalMirror, horizontal, verticalMirror, vertical })
    if (horizontalMirror < verticalMirror) {
      verticalMirror = 0
    } else {
      horizontalMirror = 0
    }
  }

  return {
    horizontal,
    vertical,
    horizontalMirror,
    verticalMirror
  }
}

async function solveForFirstStar (input) {
  const maps = parseMaps(input).map((map, index) => enhanceMap(map, index, tryAndMirror))

  const rowOffset = maps.reduce((acc, map) => acc + map.horizontalMirror, 0)
  const columnOffset = maps.reduce((acc, map) => acc + map.verticalMirror, 0)

  const solution = (rowOffset * 100) + columnOffset
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const maps = parseMaps(input).map((map, index) => enhanceMap(map, index, tryAndMirrorVariations))

  const rowOffset = maps.reduce((acc, map) => acc + map.horizontalMirror, 0)
  const columnOffset = maps.reduce((acc, map) => acc + map.verticalMirror, 0)

  const noMirrors = maps.filter(map => map.horizontalMirror === 0 && map.verticalMirror === 0).length
  console.log('No mirrors:', noMirrors)

  const solution = (rowOffset * 100) + columnOffset

  report('Solution 2:', solution)
}

run()
