class LogTimes {
  constructor (name, activations) {
    this.name = name
    this.activations = activations
  }

  save (actionTimes) {
    Object.entries(actionTimes).forEach(([key, value]) => {
      this.consoleLog(`LAST_ACTIVATION ${key} ${value}`)
    })
  }

  async retrieve () {
    const activation = await this.activations.fetchLast(this.name)
    return activation.logs.reduce((times, log) => Object.assign(times, this.parseLogLine(log)), {})
  }

  parseLogLine (logLine) {
    const result = {}
    const sections = logLine.match(/LAST_ACTIVATION (\w+) (\d+)/)
    if (sections) {
      const action = sections[1]
      const timestamp = parseInt(sections[2], 10)
      result[action] = timestamp
    }

    return result
  }

  consoleLog (output) {
    console.log(output)
  }
}

module.exports = LogTimes
