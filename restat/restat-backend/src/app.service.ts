import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {

    public getHealthCheck() {
        return {
            success: true,
            health: "OK"
        }
    }
}
