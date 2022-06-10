const { awscdk, github } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.25.0',
  defaultReleaseBranch: 'main',
  name: 'stepn-linebot',
  gitignore: ['venv', 'cdk.context.json'],
  typescriptVersion: '4.6',
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
});

project.package.addField('resolutions', {
  '@types/prettier': '2.6.0',
});
project.synth();