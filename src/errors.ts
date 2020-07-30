type ErrorGenerator = (...args: string[]) => Error

class Errors {
  CONFIG_NOT_FOUND: ErrorGenerator = (msg) =>
    new Error(`Couldn't find config file: ${msg}`)
  COULD_GET_SERVICE_LIST: ErrorGenerator = (msg) =>
    new Error(`Couldn't get services list: ${msg}`)
  CONTAINER_IS_NOT_RUNNING: ErrorGenerator = (msg) =>
    new Error(`Container is not running with name starts with: ${msg}`)
  CONTAINER_NAME_IS_AMBIGOUS: ErrorGenerator = (msg) =>
    new Error(
      `Found more than one running containers with name starts with: ${msg}`
    )
  COULDNT_DETERMINE_MODULE_NAME: ErrorGenerator = () =>
    new Error("Couldn't determine module name")
  NO_CMD: ErrorGenerator = () =>
    new Error(`No cmd found or cmd is empty in config`)
  COULDNT_START_SERVICES: ErrorGenerator = () =>
    new Error("Couldn't start services")
  COULDNT_STOP_SERVICES: ErrorGenerator = () =>
    new Error("Couldn't stop services")
}

export const errors = new Errors()
