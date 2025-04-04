import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { emailMessages } from 'src/common/constants/messages';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService, private configService: ConfigService) { }

    public async sendEmailOnInvitaion(email: string, name: string, invitationId: string, invitedBy: string) {
        const baseURL = this.configService.get("CLIENT_BASE_URL");
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Exclusive Invitation: Sign Up for the Restat App',
                template: 'user-invitation',
                context: {
                    accpetInviteUrl: `${baseURL}/accept-invite/${invitationId}/accept`,
                    name,
                    invitedBy,
                    currentYear: moment().format('YYYY')
                },
            });
        } catch (error) {
            console.error(emailMessages.emailSendError, error)
        }
    }

    public async sendCrendentialOnRequestAccept(email: string, name: string, password: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Access Your Restat Account – Personal Credentials Enclosed',
                template: 'accept-invitation',
                context: {
                    username: name,
                    email,
                    password,
                    currentYear: moment().format('YYYY')
                },
            })
        } catch (error) {
            console.error(emailMessages.credentialSentError, error)
        }
    }

    public async sendBidderForgotPassswordCredentials(adminName: string, email: string, bidderName: string, password: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Reset Your Restat Account Password',
                template: 'forgot-password-credentials',
                context: {
                    adminName,
                    username: bidderName,
                    email,
                    password,
                    currentYear: moment().format('YYYY')
                },
            })
        } catch (error) {
            console.error(emailMessages.forgetEmailError, error)
        }
    }

    public readLogoImage() {
        const logoImagePath = join(__dirname, 'templates', 'logo-icon.svg');
        return readFileSync(logoImagePath);
    }

    public async sendOtpForVerification(name: string, email: string, otp: string, expirationTime: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Verify Your Restat Account Otp',
                template: 'otp-verification',
                context: {
                    name,
                    otp,
                    expirationTime,
                    currentYear: moment().format('YYYY')
                },
            })
        } catch (error) {
            console.error(emailMessages.optVarificationError, error)
        }
    }

    public async sendOtpForDeletionVerification(name: string, email: string, workspaceName: string, otp: string, expirationTime: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Confirm Your Restat Account Deletion Otp',
                template: 'deletion-otp',
                context: {
                    name,
                    otp,
                    expirationTime,
                    workspaceName,
                    currentYear: moment().format('YYYY')
                },
            })
        } catch (error) {
            console.error(emailMessages.optVarificationError, error)
        }
    }

    public async confirmationForWorkspaceDeletion({
        name,
        email,
        superAdminEmails,
        workspaceName,
        otp,
        expirationTime,
        initiationDate,
        scheduledDeletionDate,
    }: {
        name: string;
        email: string;
        superAdminEmails: string[];
        workspaceName: string;
        otp: string;
        expirationTime: string;
        initiationDate: string;
        scheduledDeletionDate: string;
    }) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Workspace Deletion for Restat initiated',
                template: 'workspace-deletion-confirmation',
                cc: superAdminEmails,
                context: {
                    name,
                    otp,
                    expirationTime,
                    workspaceName,
                    initiationDate,
                    scheduledDeletionDate,
                    currentYear: moment().format('YYYY'),
                },
            });
        } catch (error) {
            console.error('Error sending workspace deletion confirmation email:', error);
        }
    }

    public async sendWorkSpaceDeletionToSuperAdmins({
        name,
        email,
        superAdminEmails,
        workspaceName,
        initiationDate,
        scheduledDeletionDate,
    }: {
        name: string;
        email: string;
        superAdminEmails: string[];
        workspaceName: string;
        initiationDate: string;
        scheduledDeletionDate: string;
    }) {
        try {
            await this.mailerService.sendMail({
                to: superAdminEmails,
                subject: `Workspace Deletion Initiated for ${workspaceName}`,
                template: 'workspace-deletion-notification',
                context: {
                    name,
                    email,
                    workspaceName,
                    initiationDate,
                    scheduledDeletionDate,
                    currentYear: moment().format('YYYY'),
                },
            });
        } catch (error) {
            console.error('Error sending workspace deletion notification email to Super Admins:', error);
        }
    }

}