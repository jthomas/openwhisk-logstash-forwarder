class Activations {
  constructor (client) {
    this.client = client
  }

  async fetchSince (action, since) {
    return this.fetch({
      name: action,
      since,
      docs: true
    })
  }

  async fetchLast (action) {
    return this.fetch({
      name: action,
      limit: 1,
      docs: true
    }).then(results => results[0])
  }

  async fetch (params) {
    return this.client.activations.list(params)
  }
}

module.exports = Activations
