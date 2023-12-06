const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseInput (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  const times = lines[0].split(':')[1].trim().split(/\s+/g).map(n => parseInt(n, 10))
  const distances = lines[1].split(':')[1].trim().split(/\s+/g).map(n => parseInt(n, 10))

  const pairs = times.map((time, index) => {
    return {
      time,
      distance: distances[index]
    }
  })

  return {
    times,
    distances,
    pairs
  }
}

function analyzeRaces (raceTimes) {
  const { pairs } = raceTimes
  return pairs.map(analyzeRace)
}

function analyzeRace (pair) {
  const distances = []
  for (let t = 0; t < pair.time; t++) {
    const d = t * (pair.time - t)
    distances.push(d)
  }
  return {
    pair,
    distances,
    betterDistances: distances.filter(d => d > pair.distance)
  }
}

async function solveForFirstStar (input) {
  const raceTimes = parseInput(input)
  const raceAnalyses = analyzeRaces(raceTimes)

  await write(fromHere('output.json'), JSON.stringify({ raceTimes, raceAnalyses }, null, 2), 'utf8')

  report('Analysis:', raceAnalyses)
  report('Input:', input)
  const solution = raceAnalyses.reduce((acc, raceAnalysis) => {
    return acc * raceAnalysis.betterDistances.length
  }, 1)

  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
