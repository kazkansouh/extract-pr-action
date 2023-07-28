/*
 * Created on Thu Jul 27 2023
 *
 * Copyright (c) 2023 Karim Kanso
 *
 * MIT License
 */

import * as core from '@actions/core'
import * as github from '@actions/github'

import type {components} from '@octokit/openapi-types/types'

import {inspect} from 'node:util'

export interface Inputs {
  eventName: 'push' | 'pull_request'
  token: string
  owner: string
  repo: string
  commitSha: string
}

function isEventName(o: unknown): o is 'push' | 'pull_request' {
  return typeof o === 'string' && ['push', 'pull_request'].includes(o)
}

export function getInputs(): Inputs | null {
  const inputs = {
    eventName: github.context.eventName,
    token: core.getInput('github-token', {required: true}),
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    commitSha: core.getInput('commit-sha')
  }

  if (!inputs.commitSha || inputs.commitSha === '') {
    if (inputs.eventName !== 'push') {
      core.warning('using GITHUB_SHA for a non-push event')
    }
    inputs.commitSha = github.context.sha
  } else {
    core.info(`using overridden commit sha of ${inputs.commitSha}`)
  }

  core.debug(inspect(inputs, false, 3, true))

  if (!isEventName(inputs.eventName)) {
    core.setFailed('action can only be triggered on a push or pull_request')
    return null
  }

  return {...inputs, eventName: inputs.eventName}
}

export async function getPR(
  i: Inputs
): Promise<components['schemas']['pull-request-simple'] | null> {
  const octokit = github.getOctokit(i.token)

  const r = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
    owner: i.owner,
    repo: i.repo,
    commit_sha: i.commitSha
  })
  const data = r.data

  if (data.length === 0) {
    core.error('commit not linked to a pull-request')
    return null
  }
  if (data.length !== 1) {
    core.warning('commit linked to multiple pull-requests')
    return null
  }
  return data[0]
}
