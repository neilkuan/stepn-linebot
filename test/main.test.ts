import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LineBot } from '../src/linebot-ecs-spot';

test('Snapshot', () => {
  const app = new App({
    context: {
      CHANNEL_ACCESS_TOKEN: 'mock',
      CHANNEL_SECRET: 'mock',
      STEPN_LINE_BOT_ZONE: 'example.com',
      STEPN_LINE_BOT_ZONE_ID: 'XXXXXXXXXXXXX',
    },
  });
  const stack = new Stack(app, 'test');
  new LineBot(stack, 'test');

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});