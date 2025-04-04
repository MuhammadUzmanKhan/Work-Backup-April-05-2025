import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    public getHello() {
        return {
            status: 200,
            message: "Server is running"
        };
    }
}
