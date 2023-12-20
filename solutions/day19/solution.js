const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
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
  return { workflows: mapWorkflows(workflows), parts }
}

function mapWorkflows (workflows) {
  return workflows.reduce((acc, workflow) => {
    acc[workflow.workflowId] = workflow
    return acc
  }, {})
}

function drainTokens (tokens) {
  while (tokens.length > 0) {
    tokens.pop()
  }
}

function memoize (func) {
  const cacheSet = new Set()
  const cache = {}

  return function (...args) {
    const key = args.join(',')

    if (!cacheSet.has(key)) {
      cacheSet.add(key)
      cache[key] = func.apply(this, args)
    }

    return cache[key]
  }
}

console.log(memoize)

function constructWorkflowProcessor (workflows, storeParts = true) {
  const acceptedParts = new Set()
  let a = 0

  function acceptPart (part) {
    if (acceptedParts.has(part)) {
      throw new Error(`Part ${JSON.stringify(part)} was already accepted`)
    }
    acceptedParts.add(part)
  }

  function fv (key, part) {
    return part[key] ?? key
  }

  const fnTable = {}
  function startWorkflow (workflowId, part, subWorkflow = false) {
    const workflow = workflows[workflowId]
    if (!workflow) {
      throw new Error(`Unknown workflow ${workflowId}`)
    }
    const originalTokens = workflow.tokens
    const tokens = [...originalTokens].reverse()
    const stack = []
    while (tokens.length > 0) {
      const token = tokens.pop()
      const fn = fnTable[token]
      if (fn === undefined) {
        stack.push(token)
      } else {
        const result = fn(part, stack, tokens)
        if (typeof result === 'boolean') {
          return result
        }
      }
    }
  }

  Object.assign(fnTable, {
    '<': (part, stack, tokens) => {
      const a = stack.pop()
      const b = tokens.pop()
      const result = fv(a, part) < fv(b, part)
      stack.push(result)
    },
    '>': (part, stack, tokens) => {
      const a = stack.pop()
      const b = tokens.pop()
      const result = fv(a, part) > fv(b, part)
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
        return startWorkflow(b, part, true)
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
      if (storeParts) {
        acceptPart(part)
      }
      a++
      return true
    },
    R: (part, stack, tokens) => {
      drainTokens(tokens)
      return false
    }
  })

  return {
    acceptedParts: storeParts ? acceptedParts : { size: () => a },
    startWorkflow
  }
}

function evalulateParts (workflows, parts) {
  const { acceptedParts, startWorkflow } = constructWorkflowProcessor(workflows)

  parts.forEach(part => {
    startWorkflow('in', part)
  })

  return {
    acceptedParts
  }
}

async function solveForFirstStar (input) {
  const { workflows, parts } = parseInput(input)
  const { acceptedParts } = evalulateParts(workflows, parts)

  report('Accepted parts:', acceptedParts.size)

  const solution = [...acceptedParts].reduce((acc, part) => {
    return acc + (part.x + part.m + part.a + part.s)
  }, 0)

  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  // Solution adapted from: https://github.com/yolocheezwhiz/adventofcode/blob/main/2023/day19.js
  const lines = input.split('\n')
  const len = lines.indexOf('')

  const workflows = {}
  // for each workflow
  for (let i = 0; i < len; i++) {
    // get function name
    const fnName = lines[i].split('{')[0]
    // replace that func_name in every workflow
    // avoid partial matches by ensuring the func_name is not immediately preceeded or followed by an alphabetic character
    const reg = new RegExp('(?<![a-z])' + fnName + '(?![a-z])')
    // avoid modifying the function name at the beginning of the string
    for (let j = 0; j < len; j++) lines[j] = lines[j].split('{')[0] + '{' + lines[j].split('{')[1].replace(reg, 'wf.' + fnName + '(xmas)')
  }

  // Loop again, this time to build workflow functions
  for (let i = 0; i < len; i++) {
    // get function name
    const fnName = lines[i].split('{')[0]
    // build functions with ternary logic from workflows
    /* eslint-disable no-new-func */
    workflows[fnName] = new Function('x', 'm', 'a', 's', 'wf', lines[i]
      .replaceAll(':', '?')
      .replaceAll(',', ':')
      .replace('}', ';')
      .replace(/.*{/, 'return ')
      .replaceAll('A', 'x+m+a+s')
      .replaceAll('R', '0')
      .replaceAll('xmas', 'x,m,a,s,wf'))
    /* eslint-enable no-new-func */
  }

  const ranges = {
    x: [4000],
    m: [4000],
    a: [4000],
    s: [4000]
  }

  // find ranges
  for (let i = 0; i < len; i++) {
    // get function elements
    const split = lines[i].split('{')[1].split('}')[0].split(/:|,/)
    for (const el of split) {
      // find bool evaluations
      if (el.match(/(<|>)/)) {
        // log numbers (ranges) to look for, for x,m,a & s
        // if "<" decrement by 1
        ranges[el.substring(0, 1)].push(+el.substring(2) + (el.substring(1, 2) === '>' ? 0 : -1))
      }
    }
  }

  const x = [...new Set(ranges.x)].sort((a, b) => a - b)
  const m = [...new Set(ranges.m)].sort((a, b) => a - b)
  const a = [...new Set(ranges.a)].sort((a, b) => a - b)
  const s = [...new Set(ranges.s)].sort((a, b) => a - b)

  const log = x.length * m.length * a.length * s.length
  let bean = 0
  let accepted = 0
  console.time('Bean count')
  for (let i = 0; i < x.length; i++) {
    for (let j = 0; j < m.length; j++) {
      for (let k = 0; k < a.length; k++) {
        for (let l = 0; l < s.length; l++, bean++) {
          /* Try every number in the range,
          * if it passes, we check the diff with the previous num - or use the num if it's the first in the array,
          * and multiply together
          * e.g suppose we compare 245 (previous num 243), 14 (first num in array), 150 (previous num 140), 3333 (previous num 3332)
          * if it passes the validations, we return ((245-243) * 14 * (150-140) * (3333-3332))
          * 2 * 14 * 10 * 1 = 280
          * which represents the range of values that pass this test
          */
          if (workflows.in(x[i], m[j], a[k], s[l], workflows) > 0) {
            accepted += (x[i] - x[i - 1] || x[i]) * (m[j] - m[j - 1] || m[j]) * (a[k] - a[k - 1] || a[k]) * (s[l] - s[l - 1] || s[l])
          }
          // beancounting prints
          if (bean % 50000000 === 0) {
            console.timeEnd('Bean count')
            console.log(bean / 1000000 + 'M/' + log / 1000000 + 'M processed, Accepted:', accepted)
            console.time('Bean count')
          }
        }
      }
    }
  }
  console.timeEnd('Bean count')

  console.log('Accepted parts:', accepted)

  const solution = accepted
  report('Solution 2:', solution)
}

run()
