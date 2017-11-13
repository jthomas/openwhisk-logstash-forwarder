import test from 'ava'
import sinon from 'sinon'
import index from '../lib/index'

test('should throw error for missing or invalid action parameter', t => {
  t.throws(() => index.calculateOptions({}), 'action parameter is missing or invalid')
  t.throws(() => index.calculateOptions({actions: ''}), 'action parameter is missing or invalid')
  t.throws(() => index.calculateOptions({actions: {}}), 'action parameter is missing or invalid')
  t.throws(() => index.calculateOptions({actions: []}), 'action parameter list is empty')
})

test('should throw error for invalid from parameter', t => {
  t.throws(() => index.calculateOptions({from: 'hello', actions: ['name'], logstash: {host: 'localhost', port: 5000}}), 'from parameter is not a number')
})

test('should throw error for missing or invalid logstash parameter', t => {
  t.throws(() => index.calculateOptions({actions: ['name']}), 'logstash parameter is missing or invalid')
  t.throws(() => index.calculateOptions({actions: ['name'], logstash: { port: 5000 }}), 'logstash.host parameter is missing or invalid')
  t.throws(() => index.calculateOptions({actions: ['name'], logstash: { host: 'host.com' }}), 'logstash.port parameter is missing or invalid')
})

test('should add from parameter as now if missing', t => {
  process.env['__OW_ACTION_NAME'] = '/namespace/testing'
  const params = index.calculateOptions({actions: ['name'], logstash: {host: 'localhost', port: 5000}})
  t.is(params.from, (new Date().getTime()))
  delete process.env['__OW_ACTION_NAME']
})

test('should add action name to options', t => {
  process.env['__OW_ACTION_NAME'] = '/namespace/testing'
  let options = index.calculateOptions({actions: ['name'], logstash: {host: 'localhost', port: 5000}})
  t.is(options.name, 'testing')

  process.env['__OW_ACTION_NAME'] = '/namespace/package/testing'
  options = index.calculateOptions({actions: ['name'], logstash: {host: 'localhost', port: 5000}})
  t.is(options.name, 'package/testing')
  delete process.env['__OW_ACTION_NAME']
})

test('should calculate since times', t => {
  const actions = ['first', 'second', 'third']
  const previous = { first: 1, second: 2, third: 3 }
  const from = 10
  let sinceTimes = index.calculateSinceTimes(actions, previous, from)

  t.is(Object.keys(sinceTimes).length, actions.length)
  actions.forEach(action => t.is(sinceTimes[action], previous[action] + 1))

  sinceTimes = index.calculateSinceTimes(actions, {}, from)
  t.is(Object.keys(sinceTimes).length, actions.length)
  actions.forEach(action => t.is(sinceTimes[action], from + 1))
})

test('should calculate last activation times', t => {
  let activations = []
  let previous = {}
  let result = index.lastActivationTimes(activations, previous)

  t.deepEqual(previous, {})
  t.deepEqual(result, {})

  previous = { foo: 1, bar: 2, cha: 3 }
  result = index.lastActivationTimes(activations, previous)

  t.deepEqual(previous, { foo: 1, bar: 2, cha: 3 })
  t.deepEqual(result, previous)

  activations = [
    { name: 'a', start: 10 },
    { name: 'b', start: 20 },
    { name: 'c', start: 30 }
  ]

  result = index.lastActivationTimes(activations, previous)
  t.deepEqual(previous, { foo: 1, bar: 2, cha: 3 })
  t.deepEqual(result, Object.assign({}, previous, {a: 10, b: 20, c: 30}))

  activations = [
    { name: 'foo', start: 2 },
    { name: 'bar', start: 2 },
    { name: 'cha', start: 2 }
  ]

  result = index.lastActivationTimes(activations, previous)
  t.deepEqual(previous, { foo: 1, bar: 2, cha: 3 })
  t.deepEqual(result, { foo: 2, bar: 2, cha: 3 })
})

test('should retrieve all action activations', async t => {
  const activations = [
   { activationId: 123456789 },
   { activationId: 234567890 },
   { activationId: 345678901 }
  ]

  const client = {
    fetchSince: (action, since) => {
      t.is(actions[action], since)
      return Promise.resolve(activations)
    }
  }

  const spy = sinon.spy(client, 'fetchSince')
  const actions = { first: 1, second: 2, third: 3 }
  const results = await index.fetchActivations(client, actions)

  t.true(spy.calledThrice)
  t.deepEqual(results, activations.concat(activations, activations))
})
