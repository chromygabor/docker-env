import { spawn } from 'child_process'
import { IArgs } from './index'

/**
 * Start containers defined in compose files
 */
export async function start({
  composeFiles,
  config: { projectName },
}: IArgs): Promise<void> {
  return new Promise<void>((resolutionFunc, rejectionFunc) => {
    const dcArgs = composeFiles
      .reduce<string[]>((pv, cv) => {
        return pv.concat('-f', cv)
      }, [])
      .concat('up', '-d', '--build')

    const defaults = {
      cwd: process.env.PWD,
      env: {
        ...process.env,
        COMPOSE_PROJECT_NAME: projectName,
      },
    }
    const dc = spawn('docker-compose', dcArgs, defaults)
    dc.stdout.on('data', (data) => {
      console.log(`--- stdout: ${data}`)
    })

    dc.stderr.on('data', (data) => {
      console.error(`--- stderr: ${data}`)
    })

    dc.on('close', (code) => {
      console.log(`--- child process exited with code ${code}`)
      resolutionFunc()
    })
  })
}
