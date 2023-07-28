/*
 * Created on Thu Jul 27 2023
 *
 * Copyright (c) 2023 Karim Kanso
 *
 * MIT License
 */

import * as core from '@actions/core'
import {getInputs, getPR} from './getpr'

async function run(): Promise<void> {
  try {
    core.debug('starting')

    const i = getInputs()
    if (!i) {
      return
    }

    core.debug(`owner: ${i.owner} repo: ${i.repo} commit: ${i.commitSha}`)

    const pr = await getPR(i)

    if (pr !== null) {
      core.info(`✅ got pull-request ${pr.number} for ${i.commitSha}`)
      core.setOutput('pr', pr)
    } else {
      core.warning(`❌ no pull-request found for ${i.commitSha}`)
      core.setOutput('pr', false)
    }
  } catch (error) {
    core.debug(`caught error: ${error}`)
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
  core.debug('finished')
}

run()
