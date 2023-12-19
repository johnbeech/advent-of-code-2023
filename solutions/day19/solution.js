const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

const acceptedParts = new Set()
const rejectedParts = new Set()

function acceptPart (part) {
  if (acceptedParts.has(part)) {
    throw new Error(`Part ${JSON.stringify(part)} was already accepted`)
  }
  console.log('Accept part:', part)
  acceptedParts.add(part)
}

function rejectPart (part) {
  if (rejectedParts.has(part)) {
    throw new Error(`Part ${JSON.stringify(part)} was already rejected`)
  }
  console.log('Reject part:', part)
  rejectedParts.add(part)
}

function findVal (key, part) {
  if (typeof key === 'number') {
    return key
  }
  const val = part[key]
  if (val === undefined) {
    throw new Error(`Unknown key ${key} in part ${JSON.stringify(part)}`)
  }
  return val
}

/**
 * Example workflows:
px{a<2006:qkq,m>2090:A,rfg}
pv{a>1716:R,A}
lnx{m>1548:A,A}
rfg{s<537:gd,x>2440:R,A}
qs{s>3448:A,lnx}
qkq{x<1416:A,crn}
crn{x>2662:A,R}
in{s<1351:px,qqz}
qqz{s>2770:qs,m<1801:hdj,R}
gd{a>3333:R,R}
hdj{m>838:A,pv}
 */
function parseWorkflow (line) {
  console.log('Parse line:', line)
  const matches = line.match(/([a-z]+){([a-z=><0-9:,AR]+)}/)
  const [, workflowId, workflow] = matches
  const tokens = tokenize(workflow)
  return { workflowId, tokens }
}

function tokenize (workflow) {
  const chars = workflow.split('').reverse()
  const tokens = []
  let token = ''
  while (chars.length > 0) {
    token += chars.pop()
    const nextChar = chars[chars.length - 1] ?? ''
    if (token.match(/[a-z]/) && !nextChar.match(/[a-z]/)) {
      tokens.push(token)
      token = ''
    } else if (token.match(/[0-9]/) && !nextChar.match(/[0-9]/)) {
      tokens.push(Number.parseInt(token))
      token = ''
    } else if (token.match(/[><:,AR]/)) {
      tokens.push(token)
      token = ''
    } else {
      // add more tokens
    }
  }
  if (token.length > 0) {
    tokens.push(token)
  }
  return tokens
}

function parsePartRating (line) {
  // {x=787,m=2655,a=1222,s=2876}
  const parts = line.replace(/[{}]/, '').split(',').map(part => part.split('=')).reduce((acc, [key, value]) => {
    acc[key] = parseInt(value)
    return acc
  }, {})

  return parts
}

function parseInput (lines) {
  const [input1, input2] = lines.split('\n\n')
  const workflows = input1.split('\n').map(n => n.trim()).filter(n => n).map(parseWorkflow)
  const parts = input2.split('\n').map(n => n.trim()).filter(n => n).map(parsePartRating)
  return { workflows, parts }
}

async function solveForFirstStar (input) {
  const { workflows, parts } = parseInput(input)

  const tokenFn = {}

  function drainTokens (tokens) {
    while (tokens.length > 0) {
      tokens.pop()
    }
  }

  function startWorkflow (workflowId, part) {
    const workflow = workflows.find(w => w.workflowId === workflowId)
    if (!workflow) {
      throw new Error(`Unknown workflow ${workflowId}`)
    }
    console.log('Starting workflow for', part)
    const originalTokens = workflow.tokens
    const tokens = [...originalTokens].reverse()
    const stack = []
    while (tokens.length > 0) {
      const token = tokens.pop()
      console.log('P:', part, 'T:', token, 'TS:', tokens, 'S:', stack, 'W:', workflowId, 'OTS:', originalTokens.join(' '))
      const fn = tokenFn[token]
      if (fn === undefined) {
        stack.push(token)
      } else {
        fn(part, stack, tokens)
      }
    }
  }

  Object.assign(tokenFn, {
    '<': (part, stack, tokens) => {
      const a = stack.pop()
      const b = tokens.pop()
      console.log('Compare', a, '<', b, 'stack:', stack, 'tokens:', tokens)
      const result = findVal(a, part) < findVal(b, part)
      stack.push(result)
    },
    '>': (part, stack, tokens) => {
      const a = stack.pop()
      const b = tokens.pop()
      console.log('Compare', a, '>', b, 'stack:', stack, 'tokens:', tokens)
      const result = findVal(a, part) > findVal(b, part)
      stack.push(result)
    },
    ':': (part, stack, tokens) => {
      const a = stack.pop()
      let b = tokens.pop()
      if (a === false) {
        while (b !== ',') {
          b = tokens.pop()
        }
        tokens.push(b)
      } else if (a === true && b.length === 1) {
        // continue
        tokens.push(b)
      } else if (a === true && b.length > 1) {
        drainTokens(tokens)
        return startWorkflow(b, part)
      } else {
        throw new Error(`Unknown value (a: ${a} ${typeof a}), (b: ${b}) in stack: ${JSON.stringify(stack)}, ${JSON.stringify(tokens)}`)
      }
    },
    ',': (part, stack, tokens) => {
      const b = tokens.pop()
      if (b.length === 1) {
        // continue
        tokens.push(b)
      } else if (b.length > 1) {
        drainTokens(tokens)
        return startWorkflow(b, part)
      } else {
        throw new Error(`Unknown value (b: ${b} ${typeof b}) in stack: ${JSON.stringify(stack)}, ${JSON.stringify(tokens)}`)
      }
    },
    A: (part, stack, tokens) => {
      drainTokens(tokens)
      acceptPart(part)
    },
    R: (part, stack, tokens) => {
      drainTokens(tokens)
      rejectPart(part)
    }
  })

  parts.forEach(part => {
    startWorkflow('in', part)
  })

  report('Rejected parts:', rejectedParts)
  report('Accepted parts:', acceptedParts)

  const solution = [...acceptedParts].reduce((acc, part) => {
    return acc + (part.x + part.m + part.a + part.s)
  }, 0)

  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()