import test from 'ava'
import sinon from 'sinon'
import Forwarder from '../lib/forwarder'
import EventEmitter from 'events'

test('should call writeDataFrame for each activation log', async t => {
  const writeDataFrame = sinon.spy(data => {
    return Promise.resolve()
  })

  const client = { writeDataFrame }
  const forwarder = new Forwarder(client)

  const name = 'some_action'
  const namespace = 'user@host.com_dev'

  const logs = [
    '2017-10-16T15:43:29.08404089Z  stdout: aaaa',
    '2017-10-16T15:43:29.084085937Z stdout: bbbb',
    '2017-10-16T15:43:29.084093923Z stdout: cccc'
  ]

  const activations = [
    {namespace, name, activationId: '1', logs},
    {namespace, name, activationId: '2', logs},
    {namespace, name, activationId: '3', logs}
  ]

  await forwarder.send(activations)

  t.is(writeDataFrame.callCount, activations.length * logs.length)
  activations.forEach(actv => {
    actv.logs.forEach(log => {
      t.true(writeDataFrame.calledWith({line: log, activation: actv.activationId, action: actv.name, namespace: actv.namespace}))
    })
  })
})

test('should wait for all data frames being written before returning', async t => {
  let inflight = 0
  const writeDataFrame = sinon.spy(data => {
    inflight++
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        inflight--
        resolve()
      }, 10)
    })
  })

  const client = { writeDataFrame }
  const forwarder = new Forwarder(client)

  const name = 'some_action'
  const namespace = 'user@host.com_dev'

  const logs = [
    '2017-10-16T15:43:29.08404089Z  stdout: aaaa',
    '2017-10-16T15:43:29.084085937Z stdout: bbbb',
    '2017-10-16T15:43:29.084093923Z stdout: cccc'
  ]

  const activations = [
    {namespace, name, activationId: '1', logs},
    {namespace, name, activationId: '2', logs},
    {namespace, name, activationId: '3', logs}
  ]

  await forwarder.send(activations)
  t.is(writeDataFrame.callCount, 9, 'should have called writeDataFrame called for each log line')
  t.is(inflight, 0, 'should wait till all requests are finished before returning')
})
