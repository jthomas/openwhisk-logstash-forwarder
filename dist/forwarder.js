"use strict";

class Forwarder {
  constructor(client) {
    this.client = client;
  }

  send(activations) {
    const results = activations.reduce((results, actv) => {
      const lines = actv.logs.map(log => this.client.writeDataFrame(this.toDataFrame(actv, log)));
      return results.concat(lines);
    }, []);

    return Promise.all(results);
  }

  toDataFrame(actv, log) {
    return {
      line: log, activation: actv.activationId, action: actv.name, namespace: actv.namespace
    };
  }
}

module.exports = Forwarder;