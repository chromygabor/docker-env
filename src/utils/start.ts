import { upAll } from 'docker-compose'
import { errors } from '../errors'
import { IArgs } from './index'

/**
 * Start containers defined in compose files
 */
export async function start({
  composeFiles,
  env,
  config: { projectName },
}: IArgs): Promise<void> {
  try {
    await upAll({
      cwd: process.env.PWD,
      config: composeFiles,
      env: {
        ...env,
        COMPOSE_PROJECT_NAME: projectName,
      },
      log: true,
    })
  } catch (err) {
    throw errors.COULDNT_START_SERVICES(err)
  }
}
