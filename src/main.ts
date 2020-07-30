#!/usr/bin/env node

import parseCmd from 'minimist'
import { exit } from 'process'
import { lookForConfig, attach, stop, start } from './utils'

const main = async (): Promise<void> => {
  const pwd = process.env.PWD!

  const config = lookForConfig(pwd)

  if (config instanceof Error) {
    throw config
  } else {
    const argv = parseCmd(process.argv.slice(2))
    switch (argv._[0].toUpperCase()) {
      case 'ATTACH':
        await attach(config)
        break
      case 'START':
        await start(config)
        break
      case 'STOP':
        await stop(config)
        break
      default:
        break
    }
  }
}
;(async () => {
  try {
    await main()
    exit(0)
  } catch (err) {
    console.log(err.message)
    //if(process.env)
    exit(1)
  }
})()
