# Auto Rust Version Bumper GitHub Action

Using [conventional commits]() this action will automatically detect the appropriate version for a release, update the changelog and Cargo.toml and push the release to your master branch.

## Inputs

- `personal-access-token`: *required* Needed to push changes to the branch in question. If this is a standard github action secret, and _not_ a personal access token, it can still push, but this will not trigger any other actions.
- `branch` : branch to push changelog changes to. defaults to `master`