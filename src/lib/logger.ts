type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isProduction = process.env.NODE_ENV === 'production'

function shouldLog(level: LogLevel) {
  if (level === 'error' || level === 'warn') {
    return true
  }

  return !isProduction
}

function write(level: LogLevel, message: string, meta?: unknown) {
  if (!shouldLog(level)) {
    return
  }

  const prefix = `[${level}] ${message}`

  if (meta === undefined) {
    console[level](prefix)
    return
  }

  console[level](prefix, meta)
}

export const logger = {
  debug: (message: string, meta?: unknown) => write('debug', message, meta),
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
}
