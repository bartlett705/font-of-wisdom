import Koa from 'koa'
import Router from 'koa-router'
import { Client, QueryResult } from 'pg'
import { discord, totalQuotes } from '.'
import { Logger } from './logger'

interface Hammer {
  name: string
  call: string
}

const router = new Router()

router.get('/healthcheck', (ctx: Koa.Context) => {
  ctx.status = 200
  ctx.body = 'pongHi'
  return
})

router.get('/', async (ctx: Koa.Context) => {
  const logger = ctx.state.logger as Logger
  const dbClient = ctx.state.dbClient as Client

  const { body } = ctx.request
  logger.info(JSON.stringify(body))
  const { response } = ctx
  let { count } = ctx.query

  if (Number.isNaN(Number(count)) || Number(count) === 0) {
    count = 1
  } else if (count > 20) {
    count = 20
  }

  logger.debug('Got a query for ', count, ' quotes.')
  const startID = Math.round(Math.random() * totalQuotes)
  const query = `select * from quotes where id between ${startID} and 1000 limit ${count};`

  // paranoia?
  if (query.indexOf(';') < 50 || query.indexOf(';') > 60) {
    ctx.status = 422
    response.body = JSON.stringify({
      errMessage: 'Notsure if sql injection...'
    })
    return
  }
  const result = await queryDB(logger, dbClient, query)

  if (result && result.rows) {
    // Maybe we started at the end of the db; if so, tack some on from the beginning.
    let bonusResult
    if (result.rowCount < count) {
      const bonusQuery = `select * from quotes where id between 1 and 1000 limit ${count -
        result.rowCount};`
      bonusResult = await queryDB(logger, dbClient, bonusQuery)
    }

    // Add to state for logger to pull off
    ctx.state.rowsReturned = result.rowCount
    ctx.state.dbCommand = query

    response.status = 200
    response.set('Content-Type', 'application/json')
    let quotes = result.rows
    let returnedCount = result.rowCount

    if (bonusResult) {
      quotes = [...quotes, bonusResult.rows]
      returnedCount += bonusResult.rowCount
    }
    response.body = JSON.stringify({
      count: returnedCount,
      quotes
    })
    discord.postMessage({
      avatar_url: 'https://mosey.systems/aristotle.jpg',
      content: `Serviced a search for: ${count} quotes.`,
      username: 'Aristotle'
    })
  } else {
    response.status = 500
    response.body = 'Something went wrong :/'
  }
})

async function queryDB(
  logger: Logger,
  client: Client,
  query: string,
  params?: any
) {
  return new Promise<QueryResult | null>(async (res, _) => {
    try {
      logger.debug('QUERY:', query)
      const result = await client.query(query, params)
      if (result.rows) {
        logger.debug(`Returning ${result.rows.length} rows`)
      }
      res(result)
    } catch (err) {
      logger.error('hrm')
      logger.error(err)
      res(null)
    }
  })
}

export const routes = router.routes()
