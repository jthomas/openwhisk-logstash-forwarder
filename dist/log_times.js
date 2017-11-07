"use strict";

function _objectEntries(obj) {
  var entries = [];
  var keys = Object.keys(obj);

  for (var k = 0; k < keys.length; ++k) entries.push([keys[k], obj[keys[k]]]);

  return entries;
}

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class LogTimes {
  constructor(name, activations) {
    this.name = name;
    this.activations = activations;
  }

  save(actionTimes) {
    _objectEntries(actionTimes).forEach(([key, value]) => {
      this.consoleLog(`LAST_ACTIVATION ${key} ${value}`);
    });
  }

  retrieve() {
    var _this = this;

    return _asyncToGenerator(function* () {
      const activation = yield _this.activations.fetchLast(_this.name);
      return activation.logs.reduce(function (times, log) {
        return Object.assign(times, _this.parseLogLine(log));
      }, {});
    })();
  }

  parseLogLine(logLine) {
    const result = {};
    const sections = logLine.match(/LAST_ACTIVATION (\w+) (\d+)/);
    if (sections) {
      const action = sections[1];
      const timestamp = parseInt(sections[2], 10);
      result[action] = timestamp;
    }

    return result;
  }

  consoleLog(output) {
    console.log(output);
  }
}

module.exports = LogTimes;