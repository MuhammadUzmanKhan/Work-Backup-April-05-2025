import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { CustomExceptionFilter } from './filter';
// import { AuthGuard } from './guards/auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.useGlobalGuards(new AuthGuard());
  // app.useGlobalFilters(new CustomExceptionFilter());
  await app.listen(5002);
}
bootstrap();
