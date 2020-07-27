# Auto Rust Version Bumper GitHub Action

Using [conventional commits]() this action will automatically detect the appropriate version for a release, update the changelog and Cargo.toml and create a new branch and PR for the bump commit.

## Inputs

- `oken`: *required* Needed to push changes the bump branch. If this is a standard github action secret, and _not_ a personal access token, it can still push, but this will not trigger any other actions. recommended is to use a Personal Access Token, but also a different one to any you may be using to automatically merge PRs... (eg. with [merge me action](https://github.com/ridedott/merge-me-action))
