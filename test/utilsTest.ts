import { assert } from 'chai'
import Dockerode from 'dockerode'
import { existsSync } from 'fs'
import { describe, it } from 'mocha'
import { resolve } from 'path'
import { errors } from '../src/errors'
import {
  CONFIG_FILENAME,
  IArgs,
  lookForConfig,
  start,
  stop,
} from '../src/utils'

console.log(process.env)

describe('LookForConfig', () => {
  it('Should find a config on test context', () => {
    const path = resolve(__dirname, './test-context/frontend')
    const result = lookForConfig(path)
    if (result instanceof Error) {
      assert.fail('It is an Error')
    }
  })
  it('Should not find config in a more than 5 level deep structure', () => {
    const path = resolve(__dirname, './test-context/1/2/3/4/5/6')
    const result = lookForConfig(path)
    if (!(result instanceof Error)) {
      assert.fail('It is not an Error')
    } else {
      const err = result as Error
      assert.equal(
        err.message,
        errors.CONFIG_NOT_FOUND(CONFIG_FILENAME).message
      )
    }
  })
  it('Should find config in a 5 level deep structure', () => {
    const path = resolve(__dirname, './test-context/1/2/3/4/5')
    const result = lookForConfig(path)
    if (result instanceof Error) {
      assert.fail('It is an Error')
    }
  })
  it('Should determine moduleName', () => {
    const path = resolve(__dirname, './test-context/frontend')
    const result = lookForConfig(path)
    if (result instanceof Error) {
      assert.fail('It is an Error')
    } else {
      assert.equal(result.moduleName, 'frontend')
    }
  })
  it('Should resolve compose files', () => {
    const path = resolve(__dirname, './test-context/frontend')
    const result = lookForConfig(path)
    if (result instanceof Error) {
      assert.fail('It is an Error')
    } else {
      const allExists = result.composeFiles.every((file) => existsSync(file))
      assert.isOk(
        allExists,
        "At least one compose file doesn't exist or couldn't be resolved"
      )
    }
  })
})

describe('Start and stop', () => {
  it('Should start and stop all the services', async () => {
    const args: IArgs = {
      configFile: '',
      config: {
        projectName: 'test-project',
        env: {},
        cmd: [],
        compose: [],
        services: [],
      },
      env: {},
      composeFiles: [
        resolve(__dirname, './test-context/docker-compose.yml'),
        resolve(__dirname, './test-context/docker-compose-dev.yml'),
      ],
      moduleName: '',
    }
    await start(args)
    const docker = new Dockerode()
    const startedList = await docker.listContainers()
    const startedFiltered = startedList.filter((container) => {
      return (
        container['Labels']['com.docker.compose.project'] === 'test-project'
      )
    })

    await stop(args)
    const stoppedList = await docker.listContainers()
    const stoppedFiltered = stoppedList.filter((container) => {
      return (
        container['Labels']['com.docker.compose.project'] === 'test-project'
      )
    })

    assert.isAbove(startedFiltered.length, 0)
    assert.equal(stoppedFiltered.length, 0)
  })
})
