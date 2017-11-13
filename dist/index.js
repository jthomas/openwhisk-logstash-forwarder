'use strict';

function _objectEntries(obj) {
  var entries = [];
  var keys = Object.keys(obj);

  for (var k = 0; k < keys.length; ++k) entries.push([keys[k], obj[keys[k]]]);

  return entries;
}

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const Activations = require('./activations');
const LogTimes = require('./log_times');
const Forwarder = require('./forwarder');
const lumberjack = require('./lumberjack');
const openwhisk = require('openwhisk');

const calculateOptions = params => {
  if (!Array.isArray(params.actions)) {
    throw new Error('action parameter is missing or invalid');
  } else if (!params.actions.length) {
    throw new Error('action parameter list is empty');
  }

  if (!params.logstash) {
    throw new Error('logstash parameter is missing or invalid');
  } else if (!params.logstash.host) {
    throw new Error('logstash.host parameter is missing or invalid');
  } else if (!params.logstash.port) {
    throw new Error('logstash.port parameter is missing or invalid');
  }

  if (params.from && typeof params.from !== 'number') {
    throw new Error('from parameter is not a number');
  }

  const copy = Object.assign({}, params);

  if (!copy.from) {
    copy.from = new Date().getTime();
  }

  const actionId = process.env['__OW_ACTION_NAME'];
  copy.name = actionId.split('/').slice(2).join('/');

  return copy;
};

const calculateSinceTimes = (actions, previous, from) => {
  return actions.reduce((sinceTimes, action) => {
    sinceTimes[action] = (previous[action] || from) + 1;
    return sinceTimes;
  }, {});
};

const fetchActivations = (() => {
  var _ref = _asyncToGenerator(function* (client, actions) {
    return Promise.all(_objectEntries(actions).map(function ([action, since]) {
      console.log(`search activations (${action}) since ${since}`);
      return client.fetchSince(action, since).then(function (activations) {
        const ids = activations.map(function (activation) {
          return activation.activationId;
        });
        console.log(`found ${activations.length} activations (${action}): ${ids.join(', ')}`);
        return activations;
      });
    })).then(function (results) {
      return [].concat.apply([], results);
    });
  });

  return function fetchActivations(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const lastActivationTimes = (activations, previous) => {
  const times = Object.assign({}, previous);

  return activations.reduce((times, activation) => {
    const id = activation.name;
    const prev = times[id] || 0;
    times[id] = activation.start > prev ? activation.start : prev;
    return times;
  }, times);
};

const main = (() => {
  var _ref2 = _asyncToGenerator(function* (params) {
    const options = calculateOptions(params);

    const client = openwhisk();
    const ljClient = lumberjack.client(options.logstash);

    const activations = new Activations(client);
    const logTimes = new LogTimes(options.name, activations);
    const forwarder = new Forwarder(ljClient);

    const previousTimes = yield logTimes.retrieve();

    const actions = calculateSinceTimes(options.actions, previousTimes, options.from);
    const allActivations = yield fetchActivations(activations, actions);

    yield forwarder.send(allActivations);

    const currentTimes = lastActivationTimes(allActivations, previousTimes);
    logTimes.save(currentTimes);
  });

  return function main(_x3) {
    return _ref2.apply(this, arguments);
  };
})();

Object.assign(exports, { main, calculateOptions, calculateSinceTimes, lastActivationTimes, fetchActivations });