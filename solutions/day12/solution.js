const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('example.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseSprings (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  const springs = lines.map((line, index) => {
    const [conditionString, checkString] = line.split(' ')
    const conditions = conditionString
    const compressed = conditionString.replaceAll(/\.[.]+/g, '.')
    const checks = checkString.split(',').map(check => Number.parseInt(check, 10))
    const blocks = compressed.split('.').filter(block => block.length).map(block => {
      return {
        str: block,
        contiguous: block.split('').every(char => char === '#')
      }
    })
    return {
      index,
      conditions,
      compressed,
      checks,
      blocks
    }
  })
  return springs
}

function placeChecks (spring) {
  const checks = [...spring.checks]
  const blocks = [...spring.blocks]
  let currentCheckBlock = []
  while (blocks.length > 0) {
    const currentBlock = blocks.shift()
    while (checks.length > 0) {
      const nextCheck = checks.shift()
      currentCheckBlock.push(nextCheck)
      const checkLength = currentCheckBlock.reduce((total, check) => total + check, currentCheckBlock.length - 1)
      if (checkLength === currentBlock.str.length) {
        // exact match
        currentBlock.checks = [...currentCheckBlock]
        break
      } else if (checkLength > currentBlock.str.length) {
        // step back
        currentCheckBlock.pop()
        checks.unshift(nextCheck)
        break
      } else {
        // add more blocks
      }
    }
    currentBlock.checks = [...currentCheckBlock]
    currentCheckBlock = []
  }
  console.log('Checked blocks:', spring.blocks, spring.checks)
  return spring
}

async function solveForFirstStar (input) {
  const springs = parseSprings(input)

  springs.forEach(spring => {
    placeChecks(spring)
  })

  await write(fromHere('springs.json'), JSON.stringify(springs, null, 2), 'utf8')

  const solution = 'UNSOLVED'
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
