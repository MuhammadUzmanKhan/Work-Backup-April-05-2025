import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FirebaseService from 'src/common/firebase/firebase.service';
import { OtpVerification } from 'src/common/models/otp-verification.model';
import { Users } from 'src/common/models/users.model';
import { AuthenticateUserDto } from 'src/modules/auth/dto/authenticate.dto';
import { MailService } from 'src/modules/mail/mail.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Op } from 'sequelize';
import { Sessions } from 'src/common/models/sessions.model';
import { JwtService } from '@nestjs/jwt';
import { ROLES } from 'src/common/constants/roles';
import { authMessages, superAdminMessages } from 'src/common/constants/messages';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
        private readonly jwtService: JwtService
    ) { }

    public async authenticateUser(data: AuthenticateUserDto) {
        try {
            const expirationMinutes = this.configService.get("OTP_EXPIRATION_MINUTES")
            const {
                additionalInformation: { uid },
            } = await FirebaseService.decodeIdToken(data.idToken);

            const user = await Users.findOne({
                where: {
                    uid,
                    role: ROLES.SUPER_ADMIN
                },
            });

            if (!user) throw new UnauthorizedException(authMessages.userNotFound);

            const existingOtp = await OtpVerification.findOne({
                where: {
                    userId: user.id,
                    isVerified: false,
                },
            });

            if (existingOtp) {
                await existingOtp.destroy();
            }

            const otpOverfication = await OtpVerification.create({
                userId: user.id,
                otp: Math.floor(100000 + Math.random() * 900000).toString(),
                otpExpiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
            })

            await this.mailService.sendOtpForVerification(user.name, user.email, otpOverfication.otp, expirationMinutes)

            return { message: superAdminMessages.otpSent, };
        } catch (error: any) {
            console.error(authMessages.userNotAuthenticated, error);
            throw new UnauthorizedException(authMessages.userNotAuthenticated + error.message);
        }
    }

    public async verifyOtp(data: VerifyOtpDto) {
        try {
            const {
                additionalInformation: { uid },
            } = await FirebaseService.decodeIdToken(data.idToken);

            const user = await Users.findOne({
                where: { uid },
            });

            const otp = await OtpVerification.findOne({
                where: {
                    otp: data.otp,
                    otpExpiresAt: {
                        [Op.gt]: Date.now()
                    },
                    userId: user.id,
                    isVerified: false,
                }
            })

            if (!otp) {
                throw new UnauthorizedException(superAdminMessages.otpNotValid);
            }

            otp.isVerified = true;
            otp.save();

            const session = await Sessions.create({ userId: user.id });
            const token = this.jwtService.sign(session.id);

            await session.save();

            return { token, user }
        } catch (error: any) {
            if (error.code === "auth/id-token-expired") {
                throw new UnauthorizedException(authMessages.tokenExpired);
            } else {
                throw new UnauthorizedException(authMessages.userNotAuthenticated + error.message);
            }
        }
    }
}
