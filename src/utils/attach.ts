import Docker, { ContainerInfo } from 'dockerode'
import { errors } from '../errors'
import { attachToCmdInContainer } from './docker-utils'
import { IArgs } from './index'

/**
 * Lookup for a started container which belonging to the project by projectName
 * and name starts with the moduleName, attach to it,
 * kill the original cmd and starts a new one.
 * If sigint signal receive it kills the command
 * @param
 */
export const attach = async ({
  moduleName,
  config: { projectName, cmd },
}: IArgs): Promise<void> => {
  const dockerode = new Docker()
  const containers = (await dockerode.listContainers()) as ContainerInfo[]
  const ids = containers
    .filter((container) => {
      const composeProjectField = container.Labels['com.docker.compose.project']
      const serviceField = container.Labels['com.docker.compose.service']

      if (
        composeProjectField &&
        serviceField &&
        composeProjectField === projectName &&
        serviceField.startsWith(moduleName)
      ) {
        return true
      }
      return false
    })
    .map((container) => container.Id)

  //Check if empty
  if (ids.length == 0) {
    throw errors.CONTAINER_IS_NOT_RUNNING(moduleName)
  } else if (ids.length > 1) {
    throw errors.CONTAINER_NAME_IS_AMBIGOUS(moduleName)
  } else if (!cmd || cmd.length == 0) {
    throw errors.NO_CMD()
  }

  console.debug(`Found container with id: ${ids[0]}`)
  await attachToCmdInContainer(ids[0], cmd)
  console.debug('Process is exited. Container is still running.')
}
