import test from 'ava'
import sinon from 'sinon'
import Activations from '../lib/activations'

test('should fetch activations', async t => {
  const client = { activations: { list: () => {} } }
  const lf = new Activations(client)

  const logs = [
    '2017-10-16T15:43:29.08404089Z  stdout: aaaa',
    '2017-10-16T15:43:29.084085937Z stdout: bbbb',
    '2017-10-16T15:43:29.084093923Z stdout: cccc'
  ]

  const namespace = 'user@host.com_dev'
  const name = 'my_action'

  const activations = [
    {namespace, name, activationId: '0123456789', logs},
    {namespace, name, activationId: '1234567890', logs},
    {namespace, name, activationId: '2345678901', logs}
  ]

  const stub = sinon.stub(lf.client.activations, 'list')
  stub.returns(Promise.resolve(activations))

  const results = await lf.fetch()

  t.is(results.length, 3)
  results.forEach((result, i) => {
    t.deepEqual(result, {namespace, name, activationId: activations[i].activationId, logs})
  })
})

test('should fetch activations for action name since datetime', async t => {
  const lf = new Activations()

  const action = 'some_name'
  const since = (new Date()).getTime()
  const stub = sinon.stub(lf, 'fetch').returns(Promise.resolve())
  await lf.fetchSince(action, since)

  t.true(stub.calledWith({name: action, since, docs: true}), 'list activations with name and since params')
})

test('should fetch last activation for action name', async t => {
  const lf = new Activations()

  const action = 'some_name'
  const stub = sinon.stub(lf, 'fetch').returns(Promise.resolve([{activationId: 1}]))
  const actv = await lf.fetchLast(action)

  t.true(stub.calledWith({name: action, limit: 1, docs: true}), 'list activations with name and limit params')
  t.deepEqual(actv, {activationId: 1}, 'should return activation instance')
})
