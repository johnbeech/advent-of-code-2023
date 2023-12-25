const path = require('path')
const { read, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('example.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseConnections (input) {
  // Parse instructions
  const instructions = input.split('\n').map(line => {
    const [moduleId, moduleIds] = line.split(':')
    return {
      moduleId: moduleId.trim(),
      moduleIds: moduleIds.trim().split(' ').map(id => id.trim())
    }
  })
  // Build modules
  const modules = instructions.reduce((modules, instruction) => {
    modules[instruction.moduleId] = {
      id: instruction.moduleId,
      connections: instruction.moduleIds
    }
    return modules
  }, {})
  const moduleList = Object.values(modules)

  // Add forward connections
  moduleList.forEach(module => {
    module.connections = new Set(module.connections.map((connectionId) => {
      const connectedModule = modules[connectionId] || { id: connectionId }
      modules[connectionId] = connectedModule
      return connectedModule
    }))
  })

  // Add reverse connections
  moduleList.forEach(module => {
    module.connections.forEach(connectedModule => {
      if (!connectedModule?.connections) {
        console.log('Creating connections for', connectedModule)
        connectedModule.connections = new Set()
      }
      connectedModule.connections.add(module)
    })
  })

  // Make single list of connections
  const connections = moduleList.reduce((connections, module) => {
    module.connections.forEach(connection => {
      connections.push([module, connection])
    })
    return connections
  }, [])

  // Tree search each connection to see how many modules are connected; breaking loops as we go
  connections.forEach(connection => {
    const [moduleA, moduleB] = connection
    const modules = new Set([moduleA, moduleB])
    const queue = [moduleA, moduleB]
    while (queue.length > 0) {
      const module = queue.shift()
      module.connections.forEach(connection => {
        if (!modules.has(connection)) {
          modules.add(connection)
          queue.push(connection)
        }
      })
    }
    connection.modules = modules
  })

  return {
    instructions,
    modules,
    connections
  }
}

async function solveForFirstStar (input) {
  const { connections } = parseConnections(input)

  connections.forEach(connection => {
    console.log(connection.map(module => module.id).join(' <-> '), connection.modules.size)
  })

  const solution = 'UNSOLVED'
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
