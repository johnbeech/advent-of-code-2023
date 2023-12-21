const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

class Pulse {
  constructor (type) {
    this.type = type
  }

  toString () {
    return `-${this.type}->`
  }
}

const LowPulse = new Pulse('low')
const HighPulse = new Pulse('high')
const On = Symbol('on')
const Off = Symbol('off')

let signalLogging = true
let lowPulses = 0
let highPulses = 0

function logPulse (source, pulse, destination) {
  if (pulse === LowPulse) {
    lowPulses++
  } else if (pulse === HighPulse) {
    highPulses++
  } else {
    throw new Error(`Unknown pulse: ${pulse}`)
  }

  if (signalLogging) {
    console.log(source.id, pulse.toString(), destination.id)
  }
}

class WorkQueue {
  static allQueues = []
  constructor () {
    this.queue = []
    this.timeout = 0
    WorkQueue.allQueues.push(this)
  }

  add (workFn) {
    this.queue.push(workFn)
    clearTimeout(this.timeout)
    this.processQueue()
    this.timeout = setTimeout(() => {
      this.processQueue()
    }, 0)
  }

  async processQueue () {
    while (this.queue.length > 0) {
      const workFn = this.queue.shift()
      await workFn()
    }
  }

  static noWork () {
    return WorkQueue.allQueues.every(queue => queue.queue.length === 0)
  }

  static finally (fn) {
    const interval = setInterval(() => {
      if (WorkQueue.noWork()) {
        clearInterval(interval)
        fn()
      }
    }, 0)
  }
}

class ButtonModule {
  constructor (id, destinations) {
    this.signalQueue = new WorkQueue()
    this.id = id
    this.destinations = destinations
  }

  async signal () {
    this.destinations.forEach(destination => {
      this.signalQueue.add(() => {
        destination.signal(this, LowPulse)
      })
    })
  }
}

class BroadcasterModule {
  constructor (id, destinations) {
    this.signalQueue = new WorkQueue()
    this.id = id
    this.destinations = destinations
    this.connections = []
  }

  connect (source) {
    this.connections.push(source)
  }

  signal (source, signal) {
    logPulse(source, signal, this)
    this.destinations.forEach(destination => {
      this.signalQueue.add(() => {
        destination.signal(this, signal)
      })
    })
  }
}

class FlipFlopModule {
  constructor (id, destinations) {
    this.signalQueue = new WorkQueue()
    this.id = id
    this.destinations = destinations
    this.state = Off
    this.connections = []
  }

  connect (source) {
    this.connections.push(source)
  }

  signal (source, signal) {
    logPulse(source, signal, this)
    let signalPulse
    if (signal === LowPulse) {
      if (this.state === Off) {
        this.state = On
        signalPulse = HighPulse
      } else {
        this.state = Off
        signalPulse = LowPulse
      }
      this.destinations.forEach(destination => {
        this.signalQueue.add(() => {
          destination.signal(this, signalPulse)
        })
      })
    } else if (signal === HighPulse) {
      // do nothing
    } else {
      throw new Error(`%: [${this.id}]: D[${this.destinations.map(destination => destination.id).join(', ')}] Rececived unknown signal type: ${signal}`)
    }
  }
}

class ConjunctionModule {
  constructor (id, destinations) {
    this.signalQueue = new WorkQueue()
    this.id = id
    this.destinations = destinations
    this.connections = []
    this.stateMap = {}
  }

  connect (source) {
    this.connections.push(source)
    this.stateMap[source.id] = LowPulse
  }

  get state () {
    const { stateMap } = this
    const allHigh = Object.values(stateMap).every(state => state === HighPulse)
    return allHigh ? Off : On
  }

  signal (source, signal) {
    logPulse(source, signal, this)
    this.stateMap[source.id] = signal
    const signalPulse = this.state === On ? HighPulse : LowPulse
    this.destinations.forEach(destination => {
      this.signalQueue.add(() => {
        destination.signal(this, signalPulse)
      })
    })
  }
}

class InformationModule {
  constructor (id, destinations) {
    this.signalQueue = new WorkQueue()
    this.id = id
    this.destinations = destinations
    this.connections = []
    this.signalState = null
  }

  connect (source) {
    this.connections.push(source)
  }

  signal (source, signal) {
    logPulse(source, signal, this)
    this.signalState = signal
  }
}

const moduleTypes = {
  button: ButtonModule,
  broadcaster: BroadcasterModule,
  '%': FlipFlopModule,
  '&': ConjunctionModule,
  unknown: InformationModule
}

function parseModules (input) {
  const moduleList = input.split('\n').map(line => {
    const [moduleStr, destinationStr] = line.split(' -> ')
    if (moduleStr === 'broadcaster') {
      return {
        id: 'broadcaster',
        type: 'broadcaster',
        destinations: destinationStr.split(', ').map(n => n.trim()).filter(n => n)
      }
    } else {
      const [type, ...id] = moduleStr.split('')
      return {
        id: id.join(''),
        type,
        destinations: destinationStr.split(', ').map(n => n.trim()).filter(n => n)
      }
    }
  })

  const moduleMap = moduleList.reduce((modules, module) => {
    modules[module.id] = module
    return modules
  }, {})

  const missingModules = []
  const moduleItems = moduleList.map(module => {
    const destinations = module.destinations.map(destination => {
      if (!moduleMap[destination]) {
        const missingModule = {
          id: destination,
          type: 'unknown',
          destinations: []
        }
        moduleMap[destination] = missingModule
        missingModules.push(missingModule)
      }
      return destination
    })

    const instance = new moduleTypes[module.type](module.id, destinations)
    module.instance = instance
    return instance
  })

  missingModules.forEach(missingModule => {
    const instance = new moduleTypes[missingModule.type](missingModule.id, [])
    missingModule.instance = instance
    moduleItems.push(instance)
  })

  moduleItems.forEach(module => {
    // console.log('Connecting', module.id, 'to', module.destinations)
    module.destinations = module.destinations.map(destination => moduleMap[destination].instance)
    module.destinations.forEach(destination => {
      destination.connect(module)
    })
  })

  return {
    moduleList,
    moduleMap
  }
}

async function solveForFirstStar (input) {
  const { moduleMap } = parseModules(input)
  const button = new ButtonModule('button', [moduleMap.broadcaster.instance])
  const buttonPresses = []
  const limit = 1
  for (let i = 1; i <= limit; i++) {
    const index = i
    buttonPresses.push(() => {
      const promise = new Promise(resolve => {
        WorkQueue.finally(() => {
          resolve()
        })
      })
      signalLogging = (index <= 4)
      console.log('')
      console.log('Starting button press', index, 'of', limit)
      button.signal()
      return promise
    })
  }

  while (buttonPresses.length > 0) {
    const buttonPress = buttonPresses.shift()
    await buttonPress()
  }

  let finish
  const future = new Promise(resolve => {
    finish = resolve
  })
  WorkQueue.finally(() => {
    console.log('Low pulses:', lowPulses)
    console.log('High pulses:', highPulses)

    const solution = lowPulses * highPulses
    report('Solution 1:', solution)
    finish()
  })

  return future
}

async function solveForSecondStar (input) {
  // Solution adapted from: https://github.com/surgi1/adventofcode/blob/main/2023/day20/script.js
  const MODULE_STATE = {
    OFF: 0,
    ON: 1
  }

  const PULSE_TYPE = {
    LOW: 0,
    HIGH: 1
  }

  const MODULE_TYPE = {
    NONE: 0,
    BUTTON: 1,
    BROADCAST: 2,
    FLIP_FLOP: 3,
    CONJUNCTION: 4
  }

  function init () {
    const modules = {}

    input.split('\n').forEach(line => {
      let [from, to] = line.split(' -> ')
      let type = MODULE_TYPE.NONE
      if (from === 'broadcaster') type = MODULE_TYPE.BROADCAST
      if (from[0] === '%') type = MODULE_TYPE.FLIP_FLOP
      if (from[0] === '&') type = MODULE_TYPE.CONJUNCTION
      if (from[0] === '%' || from[0] === '&') from = from.slice(1)
      modules[from] = {
        type,
        outputs: to.split(', '),
        inputs: [],
        state: (type === MODULE_TYPE.FLIP_FLOP ? MODULE_STATE.OFF : ({}))
      }
    })

    // add extra outputs
    Object.entries(modules).forEach(([id, mod]) => {
      mod.outputs.forEach(out => {
        if (modules[out] === undefined) {
          modules[out] = {
            type: MODULE_TYPE.NONE,
            outputs: [],
            inputs: [],
            state: MODULE_STATE.OFF
          }
        }
      })
    })

    // determine inputs and set default states
    Object.entries(modules).forEach(([id, mod]) => {
      mod.outputs.forEach(out => {
        if (modules[out] === undefined) {
          return modules
        }
        if (!modules[out].inputs.includes(id)) {
          modules[out].inputs.push(id)
        }
      })
    })

    Object.entries(modules).forEach(([id, mod]) => {
      if (mod.type !== MODULE_TYPE.CONJUNCTION) return true
      mod.inputs.forEach(inp => {
        mod.state[inp] = PULSE_TYPE.LOW
      })
    })

    return modules
  }

  // flip flop receives HIGH -> ignored
  // flip flop receives LOW -> if it was OFF it turns on and sends HIGH; if it was ON it turns off and sends LOW

  // conjunction remembers most recent pulse from each input modules (def LOW for all). on receiving, it updates the recent from that input
  // if all recent inputs are HIGH, sends LOW. otherwise sends LOW

  const pulses = [0, 0]
  const context = {
    satisfied: false,
    sends2rxId: null,
    satisfyFromId: null
  }
  const stack = []

  function sendPulse ({ targetId, senderId, pulseType }) {
    // console.log('sending', targetId, senderId, pulseType);
    if (targetId === context.sends2rxId && pulseType === PULSE_TYPE.HIGH && senderId === context.satisfyFromId) {
      context.satisfied = true // this is just for part2
    }

    pulses[pulseType]++

    const mod = modules[targetId]

    if (mod.type === MODULE_TYPE.BROADCAST) {
      mod.outputs.forEach(out => {
        stack.push({ targetId: out, senderId: targetId, pulseType })
      })
      return
    }

    if (mod.type === MODULE_TYPE.FLIP_FLOP) {
      if (pulseType === PULSE_TYPE.LOW) {
        if (mod.state === MODULE_STATE.OFF) {
          mod.state = MODULE_STATE.ON
          mod.outputs.forEach(out => {
            stack.push({ targetId: out, senderId: targetId, pulseType: PULSE_TYPE.HIGH })
          })
        } else {
          mod.state = MODULE_STATE.OFF
          mod.outputs.forEach(out => {
            stack.push({ targetId: out, senderId: targetId, pulseType: PULSE_TYPE.LOW })
          })
        }
      }
      return
    }

    if (mod.type === MODULE_TYPE.CONJUNCTION) {
      mod.state[senderId] = pulseType
      if (Object.values(mod.state).every(pt => pt === PULSE_TYPE.HIGH)) {
        mod.outputs.forEach(out => {
          stack.push({ targetId: out, senderId: targetId, pulseType: PULSE_TYPE.LOW })
        })
      } else {
        mod.outputs.forEach(out => {
          stack.push({ targetId: out, senderId: targetId, pulseType: PULSE_TYPE.HIGH })
        })
      }
    }
  }

  let modules = init()

  context.sends2rxId = modules.rx.inputs[0]
  const clicks = []

  for (let id = 0; id < modules[context.sends2rxId].inputs.length; id++) {
    modules = init()

    let i = 0
    context.satisfied = false
    context.satisfyFromId = modules[context.sends2rxId].inputs[id]

    while (context.satisfied === false) {
      stack.push({ targetId: 'broadcaster', senderId: 'button', pulseType: PULSE_TYPE.LOW })
      while (stack.length) {
        sendPulse(stack.shift())
      }
      i++
    }
    clicks.push(i)
  }

  const solution = lcmAll(clicks)
  report('Solution 2:', solution)
}

function gcd (a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

function lcm (a, b) {
  return a * b / gcd(a, b)
}

function lcmAll (numbers) {
  return numbers.reduce(lcm, 1)
}

run()
