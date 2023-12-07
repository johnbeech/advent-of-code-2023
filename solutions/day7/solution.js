const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const cardTypes = {
  2: { face: '2', value: 2 },
  3: { face: '3', value: 3 },
  4: { face: '4', value: 4 },
  5: { face: '5', value: 5 },
  6: { face: '6', value: 6 },
  7: { face: '7', value: 7 },
  8: { face: '8', value: 8 },
  9: { face: '9', value: 9 },
  T: { face: 'T', value: 10 },
  J: { face: 'J', value: 11 },
  Q: { face: 'Q', value: 12 },
  K: { face: 'K', value: 13 },
  A: { face: 'A', value: 14 }
}

function countOccurances (items) {
  const occurrences = items.reduce(function (acc, item) {
    const key = item?.face ?? item
    if (typeof acc[key] === 'undefined') {
      acc[key] = 1
    } else {
      acc[key] += 1
    }
    return acc
  }, {})

  // console.log('Normal occurrences:', occurrences)

  return occurrences
}

function countOccurancesWithJokers (items) {
  const occurrences = items.reduce(function (acc, item) {
    const key = item?.face ?? item
    if (typeof acc[key] === 'undefined') {
      acc[key] = 1
    } else {
      acc[key] += 1
    }
    return acc
  }, {})

  const jokers = occurrences.J
  if (jokers && jokers !== 5) {
    delete occurrences.J
    const best = Object.entries(occurrences).sort((a, b) => {
      return b[1] - a[1]
    })[0][0]
    occurrences[best] += jokers
  }

  // console.log('Joker occurrences:', occurrences)

  return occurrences
}

function createCardTests (countFn) {
  const cardTests = [{
    description: 'Five of a kind',
    fn: (cards) => {
      const occurrences = countFn(cards)
      return Object.values(occurrences).some(count => count === 5)
    },
    rank: 1
  }, {
    description: 'Four of a kind',
    fn: (cards) => {
      const occurrences = countFn(cards)
      return Object.values(occurrences).some(count => count === 4)
    },
    rank: 2
  }, {
    description: 'Full house',
    fn: (cards) => {
      const occurrences = countFn(cards)
      return Object.values(occurrences).some(count => count === 3) && Object.values(occurrences).some(count => count === 2)
    },
    rank: 3
  }, {
    description: 'Three of a kind',
    fn: (cards) => {
      const occurrences = countFn(cards)
      return Object.values(occurrences).some(count => count === 3) && Object.values(occurrences).some(count => count === 1)
    },
    rank: 4
  }, {
    description: 'Two pair',
    fn: (cards) => {
      const occurrences = countFn(cards)
      return Object.values(occurrences).filter(count => count === 2).length === 2
    },
    rank: 5
  }, {
    description: 'One pair',
    fn: (cards) => {
      const occurrences = countFn(cards)
      return Object.values(occurrences).filter(count => count === 2).length === 1
    },
    rank: 6
  }, {
    description: 'High card',
    fn: (cards) => {
      const occurrences = countFn(cards)
      return Object.values(occurrences).filter(count => count === 1).length === 5
    },
    rank: 7
  }]
  return cardTests
}

function parseHandBids (input) {
  return input.split('\n').filter(n => n).map(line => {
    const [cardString, bid] = line.split(' ')
    const cards = cardString.split('').map(card => cardTypes[card])
    return { cards, bid: Number.parseInt(bid), rank: -1 }
  })
}

function rankHands (handBids, cardTests) {
  return handBids.map(handBid => {
    const { cards } = handBid
    const cardTest = cardTests.find(test => test.fn(cards))
    if (!cardTest) {
      console.log('Unable to find card test for cards:', { cards, cardTests })
      throw new Error('Unable to find card test for cards:', cards)
    }
    return { ...handBid, testRank: cardTest?.rank, description: cardTest?.description }
  }).sort((a, b) => {
    const diff = b.testRank - a.testRank
    if (diff !== 0) {
      return diff
    } else {
      for (let i = 0; i < 5; i++) {
        const diff = a.cards[i].value - b.cards[i].value
        if (diff !== 0) {
          return diff
        }
      }
    }
    throw new Error('Unable to rank difference between cards:', { a, b })
  }).map((handBid, index) => {
    const rank = index + 1
    const score = rank * handBid.bid
    return { ...handBid, rank, score }
  })
}

async function solveForFirstStar (input) {
  const handBids = parseHandBids(input)
  const cardTests = createCardTests(countOccurances)
  const rankedHands = rankHands(handBids, cardTests)

  rankedHands.forEach(handBid => {
    handBid.values = handBid.cards.map(card => card.value).join(', ')
    handBid.cards = handBid.cards.map(card => card.face).join('')
  })

  await write(fromHere('output-part1.json'), JSON.stringify(rankedHands, null, 2), 'utf8')

  const sumOfScores = rankedHands.reduce((acc, handBid) => acc + handBid.score, 0)

  const solution = sumOfScores
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  cardTypes.J = { face: 'J', value: 0 }
  const handBids = parseHandBids(input)
  const cardTests = createCardTests(countOccurancesWithJokers)
  const rankedHands = rankHands(handBids, cardTests)
  const sumOfScores = rankedHands.reduce((acc, handBid) => acc + handBid.score, 0)

  rankedHands.forEach(handBid => {
    handBid.values = handBid.cards.map(card => card.value).join(', ')
    handBid.cards = handBid.cards.map(card => card.face).join('')
  })

  await write(fromHere('output-part2.json'), JSON.stringify(rankedHands, null, 2), 'utf8')

  const solution = sumOfScores
  report('Solution 2:', solution)
}

run()
