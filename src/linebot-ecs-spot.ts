import * as path from 'path';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as escp from 'aws-cdk-lib/aws-ecs-patterns';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53t from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export class LineBot extends Construct {
  private vpc: ec2.IVpc;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'newVpc', {
      natGateways: 0,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'LineBot-Public-Subnet',
        },
      ],
    });

    const cluster = new ecs.Cluster(this, 'cluster', {
      // use default vpc put fargate service in public subnet
      vpc: this.vpc,
      clusterName: 'LineBot',
      enableFargateCapacityProviders: true,
    });
    const tasks = new ecs.FargateTaskDefinition(this, 'tasks', {
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    tasks.addContainer('linebot', {
      image: ecs.AssetImage.fromAsset(path.join(__dirname, '../linebot')),
      containerName: 'linebot',
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'linebot',
      }),
      environment: {
        CHANNEL_ACCESS_TOKEN: this.node.tryGetContext('CHANNEL_ACCESS_TOKEN') ?? `${process.env.CHANNEL_ACCESS_TOKEN}` ?? 'mock',
        CHANNEL_SECRET: this.node.tryGetContext('CHANNEL_SECRET') ?? `${process.env.CHANNEL_SECRET}` ?? 'mock',
      },
      portMappings: [{ containerPort: 5000 }],
    });
    const hostZone = route53.HostedZone.fromHostedZoneAttributes(this, 'hostZone', {
      zoneName: this.node.tryGetContext('STEPN_LINE_BOT_ZONE') ?? process.env.STEPN_LINE_BOT_ZONE,
      hostedZoneId: this.node.tryGetContext('STEPN_LINE_BOT_ZONE_ID') ?? process.env.STEPN_LINE_BOT_ZONE_ID,
    });
    const domainName = this.node.tryGetContext('STEPN_LINE_BOT_ZONE') ? `stepn-linebot.${this.node.tryGetContext('STEPN_LINE_BOT_ZONE')}` : process.env.STEPN_LINE_BOT_ZONE ? `stepn-linebot.${process.env.STEPN_LINE_BOT_ZONE}`: 'mock';
    const certificate = new certificatemanager.Certificate(this, 'stepn-line-ca', {
      domainName,
      validation: certificatemanager.CertificateValidation.fromDns(hostZone),
    });

    const botsvc = new escp.ApplicationLoadBalancedFargateService(this, 'botsvc', {
      taskDefinition: tasks,
      serviceName: 'line-bot',
      cluster,
      // use default vpc put fargate service in public subnet.
      taskSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      // put fargate service in public subnet need public ip.
      assignPublicIp: true,
      // source: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html
      // The Fargate Spot capacity provider is not supported for Linux tasks with the ARM64 architecture,
      // Fargate Spot only supports Linux tasks with the X86_64 architecture.
      platformVersion: ecs.FargatePlatformVersion.LATEST,
      certificate,
      redirectHTTP: true,
    });
    new route53.ARecord(this, 'stepnLinebotARecord', {
      zone: hostZone,
      target: route53.RecordTarget.fromAlias(new route53t.LoadBalancerTarget(botsvc.loadBalancer)),
      recordName: 'stepn-linebot',
    });
    const svc = (botsvc.node.tryFindChild('Service')?.node.defaultChild as ecs.CfnService);
    svc.addPropertyOverride(
      'CapacityProviderStrategy', [{
        CapacityProvider: 'FARGATE_SPOT',
        Base: 1,
        Weight: 1,
      }],
    );
    svc.addPropertyDeletionOverride('LaunchType');

    botsvc.node.addDependency(this.node.tryFindChild('cluster') as ecs.CfnClusterCapacityProviderAssociations);
  }
}