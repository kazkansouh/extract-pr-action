<p align="center">
  <a href="https://github.com/kazkansouh/extract-pr-action/actions"><img alt="extract-pr-action status" src="https://github.com/kazkansouh/extract-pr-action/workflows/build-test/badge.svg"></a>
</p>

# Extract PR Action (on Push)

This is a GitHub action which uses `octokit` to call
`listPullRequestsAssociatedWithCommit`. The resulting PR is returned as output
of this action.

This is useful when needing to perform an action on repository which needs write
access after a pull request has merged. By design the access token given to a
workflow in a pull-request is read only where as one on a push is read-write.

## Example usage

```yaml
name: sample-workflow
on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Extract PR
        uses: kazkansouh/extract-pr-action@v1
        id: extract-pr
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Linked PR Found
        if: steps.test-step.outputs.pr == 'false'
        run: |
          echo No PR found

      - name: Show PR number
        if: steps.test-step.outputs.pr != 'false'
        run: |
          echo ${{ fromJson(steps.test-step.outputs.pr).number }}

      - name: Show PR labels
        if: steps.test-step.outputs.pr != 'false'
        run: |
          echo '${{ toJson(fromJson(steps.test-step.outputs.pr).labels.*.name) }}'
```

## Development

Instructions

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

Run the tests :heavy_check_mark:  
```bash
$ npm test
```

### Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder. 

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket: 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

