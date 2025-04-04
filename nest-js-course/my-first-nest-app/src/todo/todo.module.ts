import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from 'src/app.controller';
import { TodoController } from './todo.controller';
import { AppService } from 'src/app.service';
import { TodoService } from './todo.service';
import { AuthenticationMiddleware } from 'src/authentication/authentication.middleware';

@Module({
  imports: [TodoModule],
  controllers: [AppController, TodoController],
  providers: [AppService, TodoService],
})
export class TodoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes('todo/get-todos');
  }
}
