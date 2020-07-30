import { down } from 'docker-compose'
import { errors } from '../errors'
import { IArgs } from './index'

/**
 * Stop containers defined in compose files
 * @param param0 S
 */
export async function stop({
  composeFiles,
  env,
  config: { projectName },
}: IArgs): Promise<void> {
  try {
    await down({
      cwd: process.env.PWD,
      config: composeFiles,
      env: {
        ...env,
        COMPOSE_PROJECT_NAME: projectName,
      },
      log: true,
    })
  } catch (err) {
    throw errors.COULDNT_STOP_SERVICES(err)
  }
}
