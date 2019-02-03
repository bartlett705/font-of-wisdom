# Fount of Wisdom

Simple API to power beginner web development projects.

## How to Query

This API is hosted, and can be accessed via HTTP request:
`GET http://quotes.mosey.systems/api`

You can optional provide a count (up to 25) via a search parameter, like so:
`GET http://quotes.mosey.systems/api?count=5`

Note that your API rate-limiting is counted on a per-quotes-fetched basis.

## Instructions for hosting yourself

1. Clone this repository.
2. Provide a database of quotes. You can use `scripts/read-huge-file.js` to help parse text files into a psql database.
3. Create a `.env` file present in the project root to configure a connection to the `psql` database containing your quotes.
4. `npm start` should get you running in the test environment, `npm run start:production` for more machine-readable logging.
