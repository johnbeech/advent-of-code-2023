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
  return input.split('\n\n')
    .filter(n => n)
    .map(strGroup => strGroup.split('\n').filter(n => n))
}

function transposeMatrix (matrix) {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]))
}

function subtractStrings (str1, str2) {
  return str1
    .split('')
    .map((str, index) => (str !== str2[index] ? str : undefined))
    .filter(Boolean)
    .join('')
}

function findReflection (stringArray, onlySmudge = false) {
  const hasSmudge = (str1, str2) => Boolean(str1) && Boolean(str2) && onlySmudge && subtractStrings(str1, str2).length === 1

  let reflectionIndex = 0
  let isReflection = false

  while (reflectionIndex < stringArray.length - 1 && !isReflection) {
    const centerLeft = stringArray[reflectionIndex]
    const centerRight = stringArray[reflectionIndex + 1]
    let smudgeCount = hasSmudge(centerLeft, centerRight) ? 1 : 0

    if (centerLeft === centerRight || hasSmudge(centerLeft, centerRight)) {
      for (let comparisonIndex = 1; reflectionIndex + comparisonIndex < stringArray.length; comparisonIndex++) {
        const firstItemToCompare = stringArray[reflectionIndex - comparisonIndex]
        const secondItemToCompare = stringArray[reflectionIndex + 1 + comparisonIndex]
        if (
          firstItemToCompare === secondItemToCompare ||
          (!firstItemToCompare && Boolean(secondItemToCompare)) ||
          (Boolean(firstItemToCompare) && !secondItemToCompare) ||
          (hasSmudge(firstItemToCompare, secondItemToCompare) && smudgeCount < 1)
        ) {
          if (hasSmudge(firstItemToCompare, secondItemToCompare)) {
            smudgeCount += 1
          }
          isReflection = true
        } else {
          isReflection = false
          break
        }
      }
    }
    if (onlySmudge && smudgeCount !== 1) {
      isReflection = false
    }

    reflectionIndex += 1
  }

  if (isReflection) {
    return reflectionIndex
  }
  return 0
}

function findAndScoreReflection (groupLines, onlySmudge = false) {
  const horizontalLine = findReflection(groupLines, onlySmudge)
  if (horizontalLine) {
    return horizontalLine * 100
  }
  const verticalLinePosition = findReflection(
    transposeMatrix(groupLines.map(line => line.split(''))).map(line => line.join('')),
    onlySmudge
  )
  if (verticalLinePosition) {
    return verticalLinePosition
  }

  return 0
}

async function solveForFirstStar (input) {
  const maps = parseMaps(input).map(map => findAndScoreReflection(map, false))
  console.log('Maps', maps)
  const totalScore = maps.reduce((acc, score) => acc + score, 0)

  const solution = totalScore
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const maps = parseMaps(input).map(map => findAndScoreReflection(map, true))
  const totalScore = maps.reduce((acc, score) => acc + score, 0)

  const solution = totalScore
  report('Solution 2:', solution)
}

run()
