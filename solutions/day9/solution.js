const path = require('path')
const { read, write, position } = require('promise-path')
const fromHere = position(__dirname)
const report = (...messages) => console.log(`[${require(fromHere('../../package.json')).logName} / ${__dirname.split(path.sep).pop()}]`, ...messages)

async function run () {
  const input = (await read(fromHere('input.txt'), 'utf8')).trim()

  await solveForFirstStar(input)
  await solveForSecondStar(input)
}

function parseInput (input) {
  const measurements = input.split('\n').map(line => line.trim()).filter(line => line.length).map(line => {
    return {
      values: line.split(' ').map(value => parseInt(value, 10))
    }
  })
  return measurements
}

function reduceValues (values) {
  return values.reduce((acc, value, index, array) => {
    if (index > 0) {
      const prev = array[index - 1]
      const diff = value - prev
      acc.push(diff)
    }
    return acc
  }, [])
}

async function solveForFirstStar (input) {
  const measurements = parseInput(input)

  measurements.forEach(records => {
    let layer = records.values
    records.layers = [layer]
    while (layer.some(value => value !== 0)) {
      layer = reduceValues(layer)
      records.layers.push(layer)
    }

    records.layers.reverse().map((layer, index, array) => {
      if (index === 0) {
        layer.push(0)
        return layer
      }
      const previousLayer = array[index - 1]
      const prediction = layer[layer.length - 1] + previousLayer[previousLayer.length - 1]
      layer.push(prediction)
      return layer
    })

    console.log('Layers', records)
    const topLayer = records.layers[records.layers.length - 1]
    records.prediction = topLayer[topLayer.length - 1]
  })

  await write(fromHere('output.json'), JSON.stringify(measurements, null, '  '), 'utf8')

  const sumOfAllPredictions = measurements.reduce((acc, records) => {
    return acc + records.prediction
  }, 0)

  const solution = sumOfAllPredictions
  report('Input:', input)
  report('Solution 1:', solution)
}

async function solveForSecondStar (input) {
  const solution = 'UNSOLVED'
  report('Solution 2:', solution)
}

run()
