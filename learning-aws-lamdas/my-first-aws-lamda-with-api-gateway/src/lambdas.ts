import { Handler, Context } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

import * as serverlessExpress from 'aws-serverless-express';
import { AppModule } from 'src/app.module';

// Create the NestJS application with the Express adapter
const createNestServer = async (expressInstance) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
  app.enableCors(); // Enable CORS if needed
  await app.init();
};

// Lambda handler
export const handler: Handler = async (event: any, context: Context) => {
  const expressApp = express();
  await createNestServer(expressApp);
  const server = serverlessExpress.createServer(expressApp);
  return serverlessExpress.proxy(server, event, context);
};
