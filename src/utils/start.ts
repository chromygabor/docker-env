import { upAll } from 'docker-compose'
import { IArgs } from './index'

/**
 * Start containers defined in compose files
 */
export async function start({
  composeFiles,
  env,
  config: { projectName },
}: IArgs): Promise<void> {
  const input = {
    cwd: process.env.PWD,
    config: composeFiles,
    env: {
      ...env,
      COMPOSE_PROJECT_NAME: projectName,
    },
    log: true,
  }
  await upAll(input)
}
