# Rust Version Bump Branch Creator

Using [conventional commits]() this action will automatically detect the appropriate version for a release, update the changelog and Cargo.toml and create a new branch and PR for the bump commit.

## Inputs

- `token`: *required* Needed to push changes to the bump branch. If this is a standard github action secret, and _not_ a personal access token, it can still push, but this will not trigger any other actions.It is recommended to use a Personal Access Token which is different to any you may be using to automatically merge PRs... (eg. with [merge me action](https://github.com/ridedott/merge-me-action)).

- `target_branch`: *optional* The branch to compare against when determining the commits in the release. The default is `main`.
