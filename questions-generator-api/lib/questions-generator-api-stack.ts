import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class QuestionGeneratorApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Users Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Register Lambda
    const registerLambda = new NodejsFunction(this, 'RegisterLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src/auth/register/index.ts'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        USERS_TABLE: usersTable.tableName,
        ALLOWED_ORIGINS: 'http://localhost:3000,https://yourdomain.com',
      },
      bundling: {
        minify: true,
        target: 'node20',
        externalModules: ['aws-sdk'],
      }
    });

    // Login Lambda
    const loginLambda = new NodejsFunction(this, 'LoginLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src/auth/login/index.ts'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        USERS_TABLE: usersTable.tableName,
        ALLOWED_ORIGINS: 'http://localhost:3000,https://yourdomain.com',
      },
      bundling: {
        minify: true,
        target: 'node20',
        externalModules: ['aws-sdk'],
      }
    });

    // Question Generator Lambda
    const questionLambda = new NodejsFunction(this, 'GenerateQuestionsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src/function/handler.ts'),
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      bundling: {
        minify: true,
        target: 'node20',
        externalModules: ['aws-sdk'],
      },
    });

    questionLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:*'],
      resources: ['*'],
    }));

    // Grant permissions
    usersTable.grantReadWriteData(registerLambda);
    usersTable.grantReadData(loginLambda);

    const api = new apigateway.RestApi(this, 'QuestionsApi', {
      restApiName: 'Generate Interview Questions API',
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['OPTIONS', 'POST'],
        allowHeaders: ['Content-Type'],
      },
    });

    // POST /register
    const registerResource = api.root.addResource('register');
    registerResource.addMethod('POST',
      new apigateway.LambdaIntegration(registerLambda),
      {
        apiKeyRequired: false,
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
            responseParameters: { 'method.response.header.Access-Control-Allow-Origin': true },
          },
          {
            statusCode: '400',
            responseParameters: { 'method.response.header.Access-Control-Allow-Origin': true },
          }
        ]
      }
    );

    // POST /login
    const loginResource = api.root.addResource('login');
    loginResource.addMethod('POST',
      new apigateway.LambdaIntegration(loginLambda),
      {
        apiKeyRequired: false,
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
            responseParameters: { 'method.response.header.Access-Control-Allow-Origin': true },
          },
          {
            statusCode: '401',
            responseParameters: { 'method.response.header.Access-Control-Allow-Origin': true },
          }
        ]
      }
    );

    // POST /quesgen
    api.root.addResource('quesgen').addMethod('POST',
      new apigateway.LambdaIntegration(questionLambda)
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'Users DynamoDB table name'
    });
  }
}