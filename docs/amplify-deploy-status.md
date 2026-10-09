# Amplify deploy status on GitHub

`.github/workflows/deploy-status.yml` adds an **Amplify deploy** check to pushes and pull requests. The check waits for the AWS Amplify build of the same commit, then passes or fails with it. Its job summary links to the deployed site and to the build logs in the Amplify console.

- On a push to `main` or `dev`, it watches the Amplify branch with the same name.
- On a pull request, it watches the PR preview branch `pr-<number>`.
- If Amplify doesn't have that branch, the check passes with a notice, because nothing deploys from that event.
- The check is skipped until `AMPLIFY_APP_ID` is set, and it is also skipped for PRs from forks, which get no OIDC token.

The workflow signs in to AWS with GitHub OIDC, so no AWS keys are stored in GitHub. Setting it up takes three steps.

## 1. Add GitHub as an identity provider in IAM (once per AWS account)

IAM → Identity providers → Add provider:

- Type: OpenID Connect
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

Skip this step if the provider already exists.

## 2. Create a read-only role for the workflow

IAM → Roles → Create role → Custom trust policy. Replace `<ACCOUNT_ID>`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": [
            "repo:rossicler/enshrouded-skill-tree:ref:refs/heads/main",
            "repo:rossicler/enshrouded-skill-tree:ref:refs/heads/dev",
            "repo:rossicler/enshrouded-skill-tree:pull_request"
          ]
        }
      }
    }
  ]
}
```

The subject list has no wildcards. Push runs carry `ref:refs/heads/<branch>`, so only pushes to `main` and `dev` can assume the role. PR runs carry `pull_request`. PRs from forks don't get a token, so only branches in this repo, which only people with write access can push, match that value. The workflow's `push.branches` must name the same branches as the subject list. When Amplify starts deploying another branch, add it in both places, or pushes to it will fail at the AWS sign-in step.

Attach an inline permissions policy. Replace `<REGION>`, `<ACCOUNT_ID>` and `<APP_ID>`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["amplify:GetApp", "amplify:GetBranch", "amplify:ListJobs", "amplify:GetJob"],
      "Resource": [
        "arn:aws:amplify:<REGION>:<ACCOUNT_ID>:apps/<APP_ID>",
        "arn:aws:amplify:<REGION>:<ACCOUNT_ID>:apps/<APP_ID>/*"
      ]
    }
  ]
}
```

The role can only read build status. It can't start, stop or change deployments.

## 3. Set the repository variables

These values aren't secrets, so they go in repository **variables**, not secrets:

```bash
gh variable set AMPLIFY_APP_ID --body "<APP_ID>"
gh variable set AWS_REGION --body "<REGION>"
gh variable set AWS_ROLE_ARN --body "arn:aws:iam::<ACCOUNT_ID>:role/<ROLE_NAME>"
```

To find the app ID, open the app in the Amplify console: it's the `d...` segment of the URL, and it's also listed under App settings → General.

## Notes

- PR previews must be turned on in Amplify (App settings → Previews) for the PR check to have a build to watch.
- If no Amplify job for the commit appears within 10 minutes, the check fails and logs the branch's most recent jobs. That usually means the branch isn't set to auto-build.
- To make merging wait for the deploy, add **Amplify deploy** as a required status check in the branch protection rules.
