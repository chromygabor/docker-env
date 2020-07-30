const path = require('path')
const projectName = path.dirname(__filename).split(path.sep).pop()

module.exports = {
  projectName: 'test-project',
  env: {
    'TEST-ENV1': 'Test value',
    'TEST-ENV2': 'Test value2',
  },
  cmd: ['sh', '-c', 'ls -ll'],
  compose: ['docker-compose.yml', 'docker-compose-dev.yml'],
  services: {
    frontend: {
      name: 'frontend-service',
    },
  },
}
