import { Injectable } from '@nestjs/common';

@Injectable()
export default class EmailTemplateService {

    public static getInviteEmailTemplate({ username, invitedBy, accpetInviteUrl }: { username: string, invitedBy: string, accpetInviteUrl: string }) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
                <h1>Hi >>>>>>>> ${username},</h1>
                <p>
                You've been invited to join Restat by ${invitedBy}. 
                Restat is the perfect tool for business developers that allows provides bidders to Track, Measure, and Analyze their goals and KPIs, and we think you'd be a great fit for our community.
                </p>
                <p>
                To join Restat, just click on the button below.
                </p>
                <a href=${accpetInviteUrl} style="display: inline-block; padding: 10px 20px; margin: 10px 10px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Accept</a>
                <p>
                Once you've signed up, you can start using Restat right away.
                We hope to see you on Restat soon!
                </p>
                <p>Best Regards,</p>
                <p>Restat Team</p>
            </div>
            </body>
            </html>
        `
    }

    public static getCredentialsSendEmailTemplate({ username, email, password }: { username: string; email: string; password: string }) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
            <h1>Hi ${username},</h1>
            <p>
            Restat is the perfect tool for business developers that allows provides bidders to Track, Measure, and Analyze their goals and KPIs, and we think you'd be a great fit for our community.
            </p>
            <p>
            Please login with following credentials.
            </p>
            <p><strong>Email : </strong>${email}</p>
            <p><strong>Password : </strong>${password}</p>
            <p>Best Regards,</p>
            <p>Restat Team</p>
        </div>
        </body>
        </html>
    `
    }
}
