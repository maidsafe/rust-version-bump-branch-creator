const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const standardVersion = require('standard-version');
const toml = require('toml-patch')
const fs = require('fs');

const bump = async () => {
    try {
        core.debug("Running rust auto bumper ");
        const token = core.getInput('token');
        
        if( token.length === 0 ) {
            core.setFailed("`token` must be set")
            return
        }

        await exec.exec('git config --local user.email "action@github.com"');
        await exec.exec('git config --local user.name "GitHub Action"');

        let actor = process.env.GITHUB_ACTOR;
        let botName = "rust-auto-merge-bot";
        core.debug(`ACTOR: ${actor}`);
        let repo = process.env.GITHUB_REPOSITORY;
    
        // bump the version
        await standardVersion({
            noVerify: true,
            silent: false,
          });
        
        // get info for update to commit + cargo
        let version = '';
        let myError = '';

        const versionOptions = {};
        versionOptions.listeners = {
          stdout: (data) => {
            version += data.toString();
          },
          stderr: (data) => {
            myError += data.toString();
          }
        };

        await exec.exec('git', ['describe', '--tags'], versionOptions);

        version = version.trim();
        cargo_version = version.replace('v', '');
        let commit_message = '';
        core.debug(`Version bumped successfully to ${version}`);

        const msg_options = {};
        msg_options.listeners = {
          stdout: (data) => {
            commit_message += data.toString();
          },
          stderr: (data) => {
            myError += data.toString();
          }
        };

        await exec.exec('git', ['log', '-1', '--pretty=%B'], msg_options);
        core.debug(`Commit message added was: ${commit_message}`);

        // parse and update cargo.toml
        const manifestToml = fs.readFileSync('Cargo.toml', 'utf8');
        const manifest = toml.parse(manifestToml);
        manifest.package.version = cargo_version;
        fs.writeFileSync('Cargo.toml', toml.patch(manifestToml, manifest));

        // parse and update Cargo.lock (if present)
        let lockfileToml;
        try {
          lockfileToml = fs.readFileSync('Cargo.lock', 'utf8');
        } catch (error) {
          if (error.code === 'ENOENT') {
            core.debug('No Cargo.lock to update');
          } else {
            throw error
          }
        }

        if (lockfileToml != null) {
          const lockfile = toml.parse(lockfileToml);
          const crate = lockfile.package.find(p => p.name === manifest.package.name);
          if (crate != null) {
            crate.version = cargo_version;
            fs.writeFileSync('Cargo.lock', toml.patch(lockfileToml, lockfile));
          } else {
            core.warn(`Self crate (${manifest.package.name}) not present in lockfile packages`);
          }
        }

        // commit changes
        await exec.exec('git', ['reset', '--soft', 'HEAD~1']);
        await exec.exec('git', ['add', '--all']);        
        await exec.exec('git', ['commit', '-m', commit_message]);
        await exec.exec('git', ['tag', version, '-f']);

        let branchName = `version-bump-${version}`;

        // update branch with changes
        core.debug(`Creating a new branch: ${branchName}`);

        // push without tags, we tag once the PR has been merged (if you're doing that)
        await exec.exec(`git push "https://${botName}:${token}@github.com/${repo}" HEAD:${branchName} -f`);

        let owner = repo.split('/')[0];
        let repoForOctokit = repo.split('/')[1];

        core.debug(`owner: ${owner}, repo: ${repoForOctokit}`);
        const octokit = github.getOctokit(token);

        core.debug("about to create PR")

        try{ 

            let pr = await octokit.rest.pulls.create({
              owner,
              repo: repoForOctokit,
              title: `Automated version bump + changelog for ${version}`,
              head: branchName,
              base : core.getInput('target_branch')
          });
         
        }
        catch (e )
        {
          if ( e.message.includes('already exists'))
          {
            // do nothing
            core.debug("Branch already exists, so will be updated after the last push")
          }
          else {
            core.setFailed(e);
          }
        }
    
    } catch (error) {
      core.setFailed(error.message);
    }

}


bump()
