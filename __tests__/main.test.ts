import * as process from 'process'
import * as path from 'path'
import {
  expect,
  test,
  describe,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  jest
} from '@jest/globals'
import fetchMock from 'jest-fetch-mock'
import {readFile} from 'fs/promises'

describe('getInputs', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    delete process.env['INPUT_GITHUB-TOKEN']
    delete process.env['INPUT_COMMIT-SHA']
    delete process.env['GITHUB_REPOSITORY']
    delete process.env['GITHUB_SHA']
    delete process.env['GITHUB_REF']
    delete process.env['GITHUB_BASE_REF']
    delete process.env['GITHUB_EVENT_NAME']
  })

  test('is defined', async () => {
    await expect(import('../src/getpr')).resolves.toHaveProperty('getInputs')
  })

  describe('nominal', () => {
    test('push', async () => {
      process.env['INPUT_GITHUB-TOKEN'] = 'ghSecretToken'
      process.env['GITHUB_REPOSITORY'] = 'owner/repo'
      process.env['GITHUB_SHA'] = 'ee9b91b5e29d4e5d0a069626b187b0c618390df9'
      process.env['GITHUB_EVENT_NAME'] = 'push'

      const {getInputs} = await import('../src/getpr')

      expect(getInputs()).toStrictEqual({
        eventName: 'push',
        token: 'ghSecretToken',
        owner: 'owner',
        repo: 'repo',
        commitSha: 'ee9b91b5e29d4e5d0a069626b187b0c618390df9'
      })
    })

    test('pull request', async () => {
      process.env['INPUT_GITHUB-TOKEN'] = 'ghSecretToken'
      process.env['GITHUB_REPOSITORY'] = 'owner/repo'
      process.env['INPUT_COMMIT-SHA'] =
        '0bab2f48797f31f980f4f954a6e0074febe25401'
      process.env['GITHUB_EVENT_NAME'] = 'pull_request'

      const {getInputs} = await import('../src/getpr')

      expect(getInputs()).toStrictEqual({
        eventName: 'pull_request',
        token: 'ghSecretToken',
        owner: 'owner',
        repo: 'repo',
        commitSha: '0bab2f48797f31f980f4f954a6e0074febe25401'
      })
    })
  })

  test('unsupported event', async () => {
    process.env['INPUT_GITHUB-TOKEN'] = 'ghSecretToken'
    process.env['GITHUB_REPOSITORY'] = 'owner/repo'
    process.env['GITHUB_SHA'] = 'ee9b91b5e29d4e5d0a069626b187b0c618390df9'
    process.env['GITHUB_EVENT_NAME'] = 'label'

    const {getInputs} = await import('../src/getpr')

    expect(getInputs()).toBeNull()
  })

  test('missing token', async () => {
    process.env['GITHUB_REPOSITORY'] = 'owner/repo'
    process.env['GITHUB_SHA'] = 'ee9b91b5e29d4e5d0a069626b187b0c618390df9'
    process.env['GITHUB_EVENT_NAME'] = 'push'

    const {getInputs} = await import('../src/getpr')

    expect(() => getInputs()).toThrowError()
  })

  test('missing event', async () => {
    process.env['INPUT_GITHUB-TOKEN'] = 'ghSecretToken'
    process.env['GITHUB_REPOSITORY'] = 'owner/repo'
    process.env['GITHUB_SHA'] = 'ee9b91b5e29d4e5d0a069626b187b0c618390df9'

    const {getInputs} = await import('../src/getpr')

    expect(getInputs()).toBeNull()
  })
})

describe('getPR', () => {
  let response: string = ''

  beforeAll(async () => {
    jest.resetModules()
    fetchMock.enableMocks()
    response = await readFile(path.join(__dirname, 'sample-response.json'), {
      encoding: 'utf8'
    })
  })
  afterEach(() => fetchMock.resetMocks())
  afterAll(() => fetchMock.disableMocks())

  test('is defined', async () => {
    await expect(import('../src/getpr')).resolves.toHaveProperty('getPR')
  })

  test('nominal', async () => {
    fetchMock.mockResponseOnce(response, {
      headers: {'content-type': 'application/json; charset=utf-8'}
    })
    const {getPR} = await import('../src/getpr')
    await expect(
      getPR({
        eventName: 'push',
        owner: 'kazkansouh',
        repo: 'extract-pr-labels',
        commitSha: 'ee9b91b5e29d4e5d0a069626b187b0c618390df9',
        token: 'superSecret'
      })
    ).resolves.toBeInstanceOf(Object)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toBeCalledWith(
      'https://api.github.com/repos/kazkansouh/extract-pr-labels/commits/ee9b91b5e29d4e5d0a069626b187b0c618390df9/pulls',
      expect.objectContaining({
        headers: expect.objectContaining({authorization: 'token superSecret'})
      })
    )
  })

  test('no pr', async () => {
    fetchMock.mockResponseOnce('[]', {
      headers: {'content-type': 'application/json; charset=utf-8'}
    })
    const {getPR} = await import('../src/getpr')
    await expect(
      getPR({
        eventName: 'push',
        owner: 'kazkansouh',
        repo: 'extract-pr-labels',
        commitSha: 'ee9b91b5e29d4e5d0a069626b187b0c618390df9',
        token: 'superSecret'
      })
    ).resolves.toBeNull()
  })
})
