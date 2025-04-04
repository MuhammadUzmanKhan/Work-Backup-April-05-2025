import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
  UsePipes,
} from '@nestjs/common';
// import { Get } from '@nestjs/common';
import { createTodo, updateTodo } from './todo.dto';
import { AppService } from 'src/app.service';
import { TodoPipe } from './todo.pipe';

@Controller('todo')
export class TodoController {
  constructor(private appservice: AppService) {}
  private toDos = [];
  // example of Get request
  //   @Get('/create')
  //   createTodo() {
  //     return {
  //       msg: 'To do is created',
  //     };
  //   }

  // example of Post request

  //Pipes
  // @Get('user/:id')
  // @UsePipes(TodoPipe)
  // getUserById(@Param('id') id: number) {
  //   return id;
  // }
  // another example
  @Get('user/:id/:slug')
  @UsePipes(TodoPipe)
  getUserById(@Param('id') id: number) {
    return id;
  }

  @Post('/create')
  createTodo(@Body() data: createTodo) {
    const item = {
      id: new Date().getTime(),
      ...data,
      createAt: new Date().toLocaleString(),
      isComplete: false,
    };
    this.toDos.push(item);
    return item;
  }

  @Get('/get-todos')
  getAllTodos() {
    return {
      todo: this.toDos,
      total: this.toDos.length,
      msg: 'to do is fetched',
    };
  }
  @Put('/update/:id')
  updateTodoById(@Param('id') id: number, @Body() data: updateTodo) {
    const new_todo = this.toDos.map((curr) => {
      if (curr.id == id) {
        return {
          ...curr,
          title: data.title,
          isComplete: true,
        };
      }
      return curr;
    });

    this.toDos = new_todo;
    return {
      msg: 'todo is updated',
    };
  }
  @Delete('/delete/:id')
  deleteTodoById(@Param('id') id: number) {
    const new_todo = this.toDos.filter((curr) => {
      curr.id !== id;
    });

    this.toDos = new_todo;
    return {
      msg: 'todo is deleted',
    };
  }
}
