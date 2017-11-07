const lumberjack = require('lumberjack-protocol')

// Monkey-patch client library to provide promise that resolves
// when log lines are written to socket. External library swallows
// callback internally making it impossible to listen for these events.
// (I know this is horrible).
const client = (tlsConnectOptions, clientOptions) => {
  const lj_client = lumberjack.client(tlsConnectOptions, clientOptions)

  const dataFrames = new Map()

  // Wrap writeDataFrame to set lookup for promise
  // from log line value.
  const writeDataFrame = lj_client.writeDataFrame
  lj_client.writeDataFrame = function (data) {
    const finished = new Promise((resolve, reject) => {
      dataFrames.set(data.line, {resolve, reject})
    })
    writeDataFrame.call(lj_client, data)
    return finished
  }

  // Wrap socket.writeDataFrame to wrap internal callback. When callback
  // fires, lookup promise for log line and resolve.
  const socket_writeDataFrame = lj_client._socket.writeDataFrame
  lj_client._socket.writeDataFrame = function (data, cb) {
    return socket_writeDataFrame.call(lj_client._socket, data, err => {
      cb(err)
      const promise = dataFrames.get(data.line)
      if (err) {
        promise.reject(err)
      } else {
        promise.resolve()
      }
      dataFrames.delete(data.line)
    })
  }

  return lj_client
}

module.exports = { client }
