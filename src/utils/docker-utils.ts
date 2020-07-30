import Docker from 'dockerode'

export type IProcess = {
  pid: number
  ppid: number
  cmd: string
  parents: number[]
  children: number[]
}

export type IProcesses = {
  [Key: number]: IProcess
}

/**
 * Attach to a container and start the cmd in a terminal with interception SIGINT
 * @param containerID
 * @param cmd
 */
export const attachToCmdInContainer = async (
  containerID: string,
  cmd: string[]
): Promise<number> => {
  const cmdline = cmd.join(' ')
  await sendSigInt(containerID, cmdline)

  const docker = new Docker()

  const container = docker.getContainer(containerID)

  const resizeListener = async (): Promise<void> => {
    await container.resize({
      h: process.stdout.rows,
      w: process.stdout.columns,
    })
  }
  console.debug(
    `Running command: '${cmd.join(' ')} on container: ${containerID}'`
  )
  const exec = await container.exec({
    AttachStdin: true,
    AttachStdout: true,
    Tty: true,
    Cmd: cmd,
  })
  const sigIntListener = async () => {
    await sendSigInt(containerID, cmdline)
  }
  process.on('SIGINT', sigIntListener)

  process.stdout.on('resize', resizeListener)

  const stream = await exec.start({ hijack: true, stdin: true })

  const pr = new Promise<number>((resolutionFunc, rejectionFunc) => {
    stream.on('end', (): void => {
      exec.inspect(function (err, data) {
        if (!err && !data.Running) {
          process.stdout.removeListener('resize', resizeListener)
          process.removeListener('SIGINT', sigIntListener)
          resolutionFunc(data.ExitCode)
        } else if (err) {
          rejectionFunc(err)
        }
      })
    })
  })
  docker.modem.demuxStream(stream, process.stdout, process.stderr)
  process.stdin.pipe(stream)

  return pr
}

const streamToString = (stream): Promise<string> => {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })
    stream.on('error', reject)
    stream.on('end', () => {
      const bytesView = Buffer.concat(chunks)
      const b = new TextDecoder().decode(bytesView)
      resolve(b)
    })
  })
}

const execCmd = async (containerID: string, cmd: string[]): Promise<string> => {
  const docker = new Docker()

  const container = docker.getContainer(containerID)

  const exec = await container.exec({
    AttachStdin: false,
    AttachStdout: true,
    Tty: false,
    Cmd: cmd,
  })

  const stream = await exec.start({ hijack: true, stdin: false })
  return streamToString(stream)
}

const runningProcessesInContainer = async (
  containerID: string
): Promise<IProcesses> => {
  const result = await execCmd(containerID, [
    'sh',
    '-c',
    'ps -ax -o "%p|%P|" -o args',
  ])

  const r1 = result.slice(8).split('\n')

  const indicies = r1
    .slice(0, 1)[0]
    .split('|')
    .reduce<number[]>((pv, cv) => {
      return cv.trim().length > 0 ? [...pv, cv.length] : pv
    }, [])
    .slice(0, 2)

  const processes = r1
    .slice(1)
    .filter((params) => params.length > 0)
    .map((currentLine) =>
      indicies.reduce<{ rest: string; result: string[] }>(
        (pv, cv) => {
          const value = pv.rest.substring(0, cv).trim()
          const rest = pv.rest.substring(cv + 1)
          return { rest: rest, result: [...pv.result, value] }
        },
        { rest: currentLine, result: [] }
      )
    )
    .reduce<IProcesses>((pv, { rest, result }) => {
      const r = { ...pv }

      r[result[0]] = {
        pid: +result[0],
        ppid: +result[1],
        cmd: rest,
        parents: [],
        children: [],
      } as IProcess
      return r
    }, {})

  const getToRoot = (processId: string, accu: string[] = []): string[] => {
    const process = processes[processId]
    if (process.ppid == 0) return [process.ppid, ...accu]
    else return getToRoot(process.ppid, [process.ppid, ...accu])
  }

  const processesWithParentsAndChildren = Object.keys(processes).reduce<
    IProcesses
  >((processHierarchy, processId) => {
    const process = processHierarchy[processId]
    const parents = getToRoot(process.pid)
    const children = Object.keys(processHierarchy)
      .filter((processId) => {
        return processHierarchy[processId].ppid === process.pid
      })
      .map((params) => +params)

    const newProcess = {
      ...process,
      parents,
      children,
    } as IProcess
    return {
      ...processHierarchy,
      [newProcess.pid]: newProcess,
    }
  }, processes)

  return processesWithParentsAndChildren
}

const sendSigInt = async (containerID: string, cmd: string): Promise<void> => {
  const processHierarchy = await runningProcessesInContainer(containerID)
  const processes = Object.keys(processHierarchy)
    .filter((processID) => {
      return processHierarchy[processID].cmd.indexOf(cmd) === 0
    })
    .map((processID) => processHierarchy[processID])

  const toStop = processes.reduce<string[]>((pv, entryPoint) => {
    const keys = Object.keys(processHierarchy)
      .filter((processId) => {
        const process = processHierarchy[processId]
        return process.parents.includes(entryPoint.pid)
      })
      .map((params) => +params)
    return [...pv, ...keys, entryPoint.pid]
  }, [])
  if (toStop.length > 0) {
    console.debug(`Stopping process with command: '${cmd}'`)
  }
  const s = ['sh', '-c', 'kill -s 2 ' + toStop.join(' ')]
  await execCmd(containerID, s)
}
