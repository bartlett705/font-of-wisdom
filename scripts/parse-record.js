function parseRecord(pipeDelimited) {
  const fields = pipeDelimited.split('|')

  const record = {
    author: fields[0],
    quote: fields[1],
    source: fields[2]
  }

  return record
}

module.exports = parseRecord
