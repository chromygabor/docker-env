import { existsSync } from 'fs'
import { parse, resolve, sep } from 'path'
import { errors } from '../errors'

export { attach } from './attach'
export { start } from './start'
export { stop } from './stop'

export const CONFIG_FILENAME = 'docker-env.js'

export interface IEnv {
  [Key: string]: string
}
export interface IService {
  name: string
}

export interface IConfig {
  projectName: string
  env: IEnv
  cmd: string[]
  compose: string[]
  services: IService[]
}

export interface IArgs {
  configFile: string
  config: IConfig
  env: IEnv
  composeFiles: string[]
  moduleName: string
}

/**
 * Searching for config file on the path and parse it
 * @param pwd
 */
export const lookForConfig = (pwd: string, maxDepth = 5): IArgs | Error => {
  const search = (actualDir: string, level: number): string | undefined => {
    const lookingFor = resolve(actualDir, CONFIG_FILENAME)
    if (existsSync(lookingFor)) {
      return lookingFor
    } else {
      const { dir, root } = parse(lookingFor)
      if (dir != root && level != maxDepth) {
        return search(resolve(actualDir, '..'), level + 1)
      } else {
        return undefined
      }
    }
  }
  const configFile = search(pwd, 0)
  const moduleName = pwd.split(sep).pop()

  if (!configFile) {
    return errors.CONFIG_NOT_FOUND(CONFIG_FILENAME)
  } else if (!moduleName) {
    return errors.COULDNT_DETERMINE_MODULE_NAME()
  } else {
    const configFromFile: IConfig = require(configFile) // eslint-disable-line @typescript-eslint/no-var-requires

    const baseDir = parse(configFile).dir

    const composeFiles = configFromFile.compose.map((composeFileName) => {
      return resolve(baseDir, composeFileName)
    })

    const args: IArgs = {
      configFile: configFile,
      config: configFromFile,
      env: configFromFile.env,
      composeFiles: composeFiles,
      moduleName,
    }

    return args
  }
}
