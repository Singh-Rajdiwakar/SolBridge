function write(level, event, payload = {}) {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info(event, payload) {
    write("info", event, payload);
  },
  warn(event, payload) {
    write("warn", event, payload);
  },
  error(event, payload) {
    write("error", event, payload);
  },
};
