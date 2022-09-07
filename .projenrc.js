const { awscdk, github } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.40.0',
  defaultReleaseBranch: 'main',
  name: 'stepn-linebot',
  gitignore: ['venv', 'cdk.context.json'],
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve'],
      projenCredentials: github.GithubCredentials.fromPersonalAccessToken({
        secret: 'AUTO_MACHINE_TOKEN',
      }),
    },
  },
  autoApproveOptions: {
    secret: 'PROJEN_GITHUB_TOKEN',
    allowedUsernames: ['auto-machine', 'neilkuan'],
  },
  minNodeVersion: '14.17.0',
  typescriptVersion: '3.9.10',
});

project.synth();