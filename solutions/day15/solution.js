const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function hashFn (input) {
  let cur = 0
  for (let i = 0; i < input.length; i++) {
    cur += input.charCodeAt(i)
    cur *= 17
    cur = cur % 256
  }
  return cur
}

async function solveForFirstStar (input) {
  const blocks = input.split(',')

  const hashes = blocks.map(hashFn)
  const sumOfHashes = hashes.reduce((a, b) => a + b, 0)

  const solution = sumOfHashes
  report('Hashes:', hashes)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const instructions = input.split(',').map(instruction => {
    const chars = instruction.split('')
    const op1 = chars.pop()
    const op2 = chars.pop()
    const op = op1 === '-' ? '-' : '='
    const focalLength = op === '=' ? Number.parseInt(op1) : 0
    if (op === '-') {
      chars.push(op2)
    }
    const label = chars.join('')
    return {
      box: hashFn(label),
      op,
      focalLength,
      label
    }
  })

  const boxes = []
  while (boxes.length < 256) {
    boxes.push({ id: boxes.length, lenses: [], focusPower: 0 })
  }

  while (instructions.length) {
    const instruction = instructions.shift()
    if (instruction.op === '-') {
      boxes[instruction.box].lenses = boxes[instruction.box].lenses.filter(lens => lens.label !== instruction.label)
    } else {
      const existingLens = boxes[instruction.box].lenses.find(lens => lens.label === instruction.label)
      if (existingLens) {
        existingLens.focalLength = instruction.focalLength
      } else {
        const newLens = {
          label: instruction.label,
          focalLength: instruction.focalLength
        }
        boxes[instruction.box].lenses.push(newLens)
      }
    }
  }

  const totalFocusPower = boxes.reduce((sum, box) => {
    box.focusPower = box.lenses.reduce((acc, lens, index) => {
      console.log('Focusing lens:', lens, 'with power:', (1 + box.id), (1 + index), lens.focalLength)
      lens.focusPower = (1 + box.id) * (1 + index) * lens.focalLength
      return acc + lens.focusPower
    }, 0)
    box.lenses = box.lenses.map(lens => `[${lens.label} ${lens.focalLength} ${lens.focusPower}]`).join(' ')
    return sum + box.focusPower
  }, 0)

  report('Boxes:', boxes.filter(box => box.lenses.length > 0))
  report('Instructions:', instructions)

  const solution = totalFocusPower
  report('Solution 2:', solution)
}

run()
