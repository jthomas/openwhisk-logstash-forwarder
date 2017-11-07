const Activations = require('./activations')
const LogTimes = require('./log_times')
const Forwarder = require('./forwarder')
const openwhisk = require('openwhisk')

const lumberjack = require('lumberjack-protocol')

const calculateOptions = (params) => {
  if (!Array.isArray(params.actions)) {
    throw new Error('action parameter is missing or invalid')
  } else if (!params.actions.length) {
    throw new Error('action parameter list is empty')
  }

  if (!params.logstash) {
    throw new Error('logstash parameter is missing or invalid')
  } else if (!params.logstash.host) {
    throw new Error('logstash.host parameter is missing or invalid')
  } else if (!params.logstash.port) {
    throw new Error('logstash.port parameter is missing or invalid')
  }

  if (params.from && typeof params.from !== 'number') {
    throw new Error('from parameter is not a number')
  }

  const copy = Object.assign({}, params)

  if (!copy.from) {
    copy.from = (new Date()).getTime()
  }

  copy.name = process.env['__OW_ACTION_NAME']

  return copy
}

const calculateSinceTimes = (actions, previous, from) => {
  return actions.reduce((sinceTimes, action) => {
    sinceTimes[action] = (previous[action] || from) + 1
    return sinceTimes
  }, {})
}

const fetchActivations = async (client, actions) => {
  return Promise.all(Object.entries(actions).map(([action, since]) => {
    console.log(`search activations (${action}) since ${since}`)
    return client.fetchSince(action, since).then(activations => {
      const ids = activations.map(activation => activation.activationId)
      console.log(`found ${activations.length} activations (${action}): ${ids.join(', ')}`)
      return activations
    })
  })).then(results => [].concat.apply([], results))
}

const lastActivationTimes = (activations, previous) => {
  const times = Object.assign({}, previous)

  return activations.reduce((times, activation) => {
    const id = activation.name
    const prev = times[id] || 0
    times[id] = (activation.start > prev) ? activation.start : prev
    return times
  }, times)
}

const main = async (params) => {
  const options = calculateOptions(params)

  const client = openwhisk()
  const ljClient = lumberjack.client(options.logstash)

  const activations = new Activations(client)
  const logTimes = new LogTimes(options.name, activations)
  const forwarder = new Forwarder(ljClient)

  const previousTimes = await logTimes.retrieve()

  const actions = calculateSinceTimes(options.actions, previousTimes, options.from)
  const allActivations = await fetchActivations(activations, actions)

  await forwarder.send(allActivations)

  const currentTimes = lastActivationTimes(allActivations, previousTimes)
  logTimes.save(currentTimes)
}

Object.assign(exports, {main, calculateOptions, calculateSinceTimes, lastActivationTimes, fetchActivations})
