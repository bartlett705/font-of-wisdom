import dotenv from 'dotenv'
dotenv.config({})

export enum BuildType {
  Production = 'prod',
  Development = 'dev',
  Test = 'test'
}

function getBuildType(env: NodeJS.ProcessEnv) {
  switch (env.BUILD_TYPE) {
    case 'prod':
      return BuildType.Production
    case 'dev':
      return BuildType.Development
    case 'test':
    default:
      return BuildType.Test
  }
}

const buildType = getBuildType(process.env)

export const config = {
  buildType,
  discordToken: process.env.DISCORD_TOKEN,
  logLevel: buildType === BuildType.Production ? 0 : 4,
  port: buildType === BuildType.Production ? 7345 : 7347,
  prettyPrint: buildType === BuildType.Production ? false : true
}
