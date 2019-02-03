/**
 *
 * sources:
 *  - stackoverflow.com/questions/16010915/parsing-huge-logfiles-in-node-js-read-in-line-by-line
 **/
require('dotenv').config()
const { Client } = require('pg')
const chalk = require('chalk')
const fs = require('fs')
const es = require('event-stream')
const parseRecord = require('./parse-record')

const { PGHOST, PGPORT, PGDATABASE, PGUSER } = process.env
dbLog(`DB ${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}`)
const client = new Client()

function dbLog(s) {
  console.log(chalk.yellow(s))
}

async function main() {
  await client.connect()
  dbLog('Connected')

  dbLog('Creating Table')
  await queryDB(
    client,
    `
      CREATE TABLE quotes (
        id SERIAL PRIMARY KEY,
        author VARCHAR(255),
        quote VARCHAR UNIQUE,
        source VARCHAR(255)
      );
    `
  )

  var lineNr = 0

  var s = fs
    .createReadStream('quotes.dat')
    .pipe(es.split())
    .pipe(
      es
        .mapSync(async function(line) {
          s.pause()
          lineNr += 1

          //   entries.push(process(line));
          const { author, quote, source } = parseRecord(line)
          const query = `INSERT INTO quotes(author, quote, source) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`
          const params = [author, quote, source]
          try {
            await queryDB(client, query, params)
          } catch {}
          logMemoryUsage(lineNr, author)
          s.resume()
        })
        .on('error', function(err) {
          console.log('Error while reading file.', err)
        })
        .on('end', async function() {
          console.log(chalk.green('Read entire file.'))
          console.log(chalk.blue('Ending client sesh'))
          await client.end()
        })
    )
}

async function queryDB(client, query, params) {
  return new Promise(async (res, _) => {
    try {
      const result = await client.query(query, params)
      res(result)
    } catch (err) {
      console.error(chalk.red(err))
      res()
    }
  })
}

function logMemoryUsage(lineNr, author) {
  console.log('Processing Record: ', lineNr, author)
}

main()
