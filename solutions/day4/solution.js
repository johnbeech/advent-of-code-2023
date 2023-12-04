const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

/**
 * Example card input.txt
Card   1: 71 88 83  5 15 54 89 55 69 79 | 83 39 58 32 99 54 91 19 44  5 57 29 88  9 95 15 79 71 90 69 43 66 55 12 89
Card   2: 33 11 66 48 67 95 78 71 98 65 | 66  2  1 59 77 95 61 71  8 38 18 62 10 65 53 17 75 92 64 50 67 21 51 78 98
Card   3: 28 58 71 40 25 13  7 19 61 72 | 47 89 96  3 84 77 81 76 93 20 34  7 25 91 71 22 36  9 40 98 60 67 35 54 49
Card   4: 58 26 74 94 42 29  9 90 76 54 | 74 90 41 32 19 80 27 97  9  2 57 45 29 42 76 37 83 58 25 46 94 86 63 24 12
 */

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseCardsFromInput (input) {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length)
  const cards = lines.map(parseCardLine)

  return cards
}

function parseCardLine (line) {
  const matcher = /Card\s+(\d+):\s+([\s\d]*)\s\|\s([\s\d]*)/
  const matches = line.match(matcher)
  const [, cardNumber, firstHalf, secondHalf] = matches
  // console.log('Matches', matches)
  const pickedNumbers = firstHalf.split(' ').filter(n => n).map(n => parseInt(n, 10))
  const drawnNumbers = secondHalf.split(' ').filter(n => n).map(n => parseInt(n, 10))
  const winningNumbers = pickedNumbers.filter(n => drawnNumbers.includes(n))
  return {
    card: cardNumber,
    pickedNumbers,
    drawnNumbers,
    winningNumbers,
    points: Math.pow(2, winningNumbers.length)
  }
}

async function solveForFirstStar (input) {
  const cards = parseCardsFromInput(input)
  console.log('Cards', cards)

  await write(fromHere('cards.json'), JSON.stringify(cards, null, 2), 'utf8')

  const totalPoints = cards.reduce((total, card) => total + card.points, 0)
  const solution = totalPoints

  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
