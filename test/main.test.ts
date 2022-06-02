import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MyStack } from '../src/main';

test('Snapshot', () => {
  const app = new App({
    context: {
      CHANNEL_ACCESS_TOKEN: 'mock',
      CHANNEL_SECRET: 'mock',
      STEPN_LINE_BOT_ZONE: 'mock',
      STEPN_LINE_BOT_ZONE_ID: 'mock',
    },
  });
  const stack = new MyStack(app, 'test');

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});