import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer() server: Server;
  handleConnection(client: Socket) {
    console.log(`New user connected: ${client.id}`);
    client.broadcast.emit('user-joined', {
      message: `New user joined the chat:${client.id}`,
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`user disconnected: ${client.id}`);
    this.server.emit('user-joined', {
      message: `user left the chat:${client.id}`,
    });
  }

  @SubscribeMessage('message')
  // handleMessage(client: Socket, message: any) {
  //   client.emit('reply', 'This is a reply', message);
  //   //broadcasting sending message to multiple clients
  //   // this.server.emit('reply', '..broadcasting');
  // }
  handleMessage(@MessageBody() message: string) {
    this.server.emit('message', message);
  }
  //socket.on
  //io.emit
  //socket.emit()
}
