const client = require('prom-client');

const registry = new client.Registry();

client.collectDefaultMetrics({
  register: registry,
  prefix: 'recipe_'
});

const httpRequests = new client.Counter({
  name: 'recipe_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry]
});

const loginFailures = new client.Counter({
  name: 'recipe_login_failures_total',
  help: 'Total failed login attempts',
  registers: [registry]
});

function logEvent(event, fields = {}) {
  console.log(JSON.stringify({
    ...fields,
    timestamp: new Date().toISOString(),
    service: 'recipe-app',
    event
  }));
}

function requestLogger(req, res, next) {
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs =
      Number(process.hrtime.bigint() - started) / 1e6;

    httpRequests.inc({
      method: req.method,
      route: req.route ? req.route.path : 'unmatched',
      status: String(res.statusCode)
    });

    if (req.path !== '/metrics' && req.path !== '/health') {
      logEvent('http_request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ip: req.ip,
        duration_ms: Math.round(durationMs)
      });
    }
  });

  next();
}

module.exports = {
  registry,
  loginFailures,
  logEvent,
  requestLogger
};
