import client from "prom-client";

// Enable default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics();

// Counter for tracking all HTTP requests
const httpRequestCounter = new client.Counter({
  name: "local_http_request_total",
  help: "Total number of HTTP requests",
  labelNames: ["methodname", "status", "endpoint_url", "result", "operation"],
});

export const named = (operationName) => (req, res, next) => {
  req.operationName = operationName;
  next();
};

export { httpRequestCounter };
export const register = client.register;
