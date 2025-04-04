import { Handler, Context, Callback } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { AppModule } from './app.module';
import * as serverlessExpress from 'aws-serverless-express';

// Create an Express instance
const server = express();

// Create the NestJS application with the Express adapter
const createNestServer = async (expressInstance) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
  app.enableCors(); // Enable CORS if needed
  await app.init();
};

// Initialize the NestJS application
let cachedServer;
const bootstrapServer = async () => {
  if (!cachedServer) {
    await createNestServer(server);
    cachedServer = serverlessExpress.createServer(server);
  }
  return cachedServer;
};

// Lambda handler
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  console.log('Event:', JSON.stringify(event));
  console.log('Context:', JSON.stringify(context));
  const server = await bootstrapServer();
  return serverlessExpress.proxy(server, event, context, 'PROMISE').promise;
};
