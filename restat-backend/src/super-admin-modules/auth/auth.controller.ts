import { Controller, Post, Body } from "@nestjs/common";
import { Public } from "src/common/decorators/public.meta";
import { AuthService } from "./auth.service";
import { AuthenticateUserDto } from "src/modules/auth/dto/authenticate.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";


@Controller('super-admin/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post("authenticate")
    public signup(@Body() data: AuthenticateUserDto) {
        return this.authService.authenticateUser(data);
    }

    @Public()
    @Post("verify-otp")
    public verifyOtp(@Body() data: VerifyOtpDto) {
        return this.authService.verifyOtp(data);
    }

}
