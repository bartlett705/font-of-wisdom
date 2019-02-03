import fetch from 'node-fetch'

export interface DiscordMessage {
  content: string
  username?: string
  avatar_url?: string
  embeds?: any
}

export class Discord {
  constructor(private discordToken: string, private channelID: string) {
    if (!discordToken || !channelID) {
      throw new Error('Discord config missing')
    }
  }

  public async postMessage(msg: DiscordMessage) {
    try {
      const res = await fetch(
        `https://discordapp.com/api/webhooks/${this.channelID}/${
          this.discordToken
        }`,
        {
          body: JSON.stringify(msg),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST'
        }
      )
    } catch (err) {
      console.error('Error posting webhook to discord :/')
    }
  }
}
