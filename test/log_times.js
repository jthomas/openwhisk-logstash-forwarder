import test from 'ava'
import sinon from 'sinon'
import LogTimes from '../lib/log_times'

test('should print console line for each function', t => {
  const lt = new LogTimes()

  const times = {
    my_action: (new Date()).getTime(),
    another_action: (new Date()).getTime(),
    final_action: (new Date()).getTime()
  }

  const stdout = []
  sinon.stub(lt, 'consoleLog').callsFake(line => stdout.push(line))
  lt.save(times)

  t.is(stdout.length, Object.keys(times).length, 'has not printed a log line for each input parameter')
  Object.entries(times).forEach(([key, value], index) => {
    t.is(stdout[index], `LAST_ACTIVATION ${key} ${value}`, 'has not printed correct log line for action')
  })
})

test('should parse times and action from log lines', t => {
  const lt = new LogTimes()

  const ts = (new Date()).getTime()
  let result = lt.parseLogLine(`2017-10-16T15:43:29.08404089Z  stdout: LAST_ACTIVATION action_name ${ts}`)
  t.deepEqual(result, {'action_name': ts})
  result = lt.parseLogLine(`2017-10-16T15:43:29.08404089Z  stdout: action_name ${ts}`)
  t.deepEqual(result, {})
  result = lt.parseLogLine(`2017-10-16T15:43:29.08404089Z  stdout: LAST_ACTIVATION action_name`)
  t.deepEqual(result, {})
  result = lt.parseLogLine(`2017-10-16T15:43:29.08404089Z  stdout: last_activation action_name ${ts}`)
  t.deepEqual(result, {})
})

test('should return last invocation times from logging output', async t => {
  const name = 'log_forwarder'
  const timestamp = (new Date()).getTime()

  const logs = [
    `2017-10-16T15:43:29.08404089Z  stdout: ignore ${timestamp}`,
    `2017-10-16T15:43:29.08404089Z  stdout: last_activation blah ${timestamp}`,
    `2017-10-16T15:43:29.08404089Z  stdout: LAST_ACTIVATION action_name ${timestamp}`,
    `2017-10-16T15:43:29.084085937Z stdout: LAST_ACTIVATION some_action ${timestamp}`,
    `2017-10-16T15:43:29.084093923Z stdout: LAST_ACTIVATION final_action ${timestamp}`,
    `2017-10-16T15:43:29.08404089Z  stdout: ignore ignore`,
    `2017-10-16T15:43:29.08404089Z  stdout: some other log messages`
  ]

  const fetchLast = sinon.stub().callsFake(action => {
    t.is(action, name)
    return Promise.resolve({logs: logs})
  })
  const lt = new LogTimes(name, { fetchLast })

  const result = await lt.retrieve()

  t.is(Object.keys(result).length, 3, 'log times do not equal number of valid log lines')
  t.is(result.action_name, timestamp)
  t.is(result.some_action, timestamp)
  t.is(result.final_action, timestamp)
})
