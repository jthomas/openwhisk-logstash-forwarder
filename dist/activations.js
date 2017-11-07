"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class Activations {
  constructor(client) {
    this.client = client;
  }

  fetchSince(action, since) {
    var _this = this;

    return _asyncToGenerator(function* () {
      return _this.fetch({
        name: action,
        since,
        docs: true
      });
    })();
  }

  fetchLast(action) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      return _this2.fetch({
        name: action,
        limit: 1,
        docs: true
      }).then(function (results) {
        return results[0];
      });
    })();
  }

  fetch(params) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      return _this3.client.activations.list(params);
    })();
  }
}

module.exports = Activations;