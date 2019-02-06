import cors from '@koa/cors'
import chalk from 'chalk'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { Client } from 'pg'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { BuildType, config } from './config'
import { Discord } from './discord'
import { Logger, requestLoggerMiddleware } from './logger'
import { routes } from './routes'

const logger = new Logger(config.logLevel)
const { PGHOST, PGPORT, PGDATABASE, PGUSER } = process.env
logger.debug(`DB ${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}`)
const dbClient = new Client()

export const discord = new Discord(config.discordToken, '540026980205330453')

dbClient.connect()

export let totalQuotes = 0

dbClient.query('SELECT count(author) FROM quotes').then((res) => {
  logger.info(`${res.rows[0].count} Quotes, ready to serve!`)
  totalQuotes = res.rows[0].count
})

const app = new Koa()
app.proxy = true

const rateLimiterOpts = {
  duration: 30, // Time to reset
  points: 50
}

const rateLimiter = new RateLimiterMemory(rateLimiterOpts)

app.use(
  cors({
    allowMethods: ['GET', 'POST'],
    credentials: true
  })
)

app.use(async (ctx, next) => {
  try {
    const canonicalIP = ctx.request.ips.length
      ? JSON.stringify(ctx.request.ips)
      : ctx.request.ip
    const res = await rateLimiter.consume(canonicalIP, ctx.query.count || 1)
    logger.debug(
      `${canonicalIP} consumed ${ctx.query.count || 1} point(s), ${
        res.remainingPoints
      } remaining, ${res.msBeforeNext}ms to reset.`
    )
    ctx.set('X-RateLimit-Consumed', String(res.consumedPoints))
    ctx.set('X-RateLimit-Remaining', String(res.remainingPoints))
    await next()
  } catch (rejRes) {
    ctx.status = 429
    ctx.set('X-RateLimit-Remaining', String(0))
    ctx.body = 'Slow down there, cowboy 😛'
  }
})

app.use(
  bodyParser({
    onerror(err, ctx) {
      logger.error('Body Parser shat:', err)
      ctx.throw('body parse error', 422)
    }
  })
)

app.use(requestLoggerMiddleware(logger, dbClient))

app.use(routes)
app.listen(config.port)

logger.warn('hi yall ^_^')
console.log(
  chalk.greenBright(
    `famous quotes backend is running on port ${config.port} | `
  ),
  chalk.greenBright('build type:'),
  config.buildType === BuildType.Production
    ? chalk.redBright('PROD')
    : chalk.yellowBright(config.buildType)
)
