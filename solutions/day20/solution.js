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
    this.timeout = setTimeout(() => {
      this.processQueue()
    }, 1)
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
    }, 10)
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
  const limit = 1000
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

  WorkQueue.finally(() => {
    console.log('Low pulses:', lowPulses)
    console.log('High pulses:', highPulses)

    const solution = lowPulses * highPulses
    report('Solution 1:', solution)
  })
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
