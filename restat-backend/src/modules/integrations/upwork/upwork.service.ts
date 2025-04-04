import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Users } from 'src/common/models/users.model';
import axios from 'axios';


@Injectable()
export class IntegrationsServiceUpwork {
    constructor() { }


    public async saveUpworkAccessToken(user: Users, code: string) {
        try {
            const data = await this.getUpworkAccessToken(code)
            return { user, code, data }
        }
        catch (err) {
            console.error('Error Occurred in saveUpworkAccessToken', err);
            throw new InternalServerErrorException(err)
        }
    }


    async getUpworkAccessToken(code: string) {
        try {
            const configService = new ConfigService();
            const tokenParams = {
                grant_type: 'authorization_code',
                code,
                client_id: configService.get('UPWORK_CLIENT_ID'),
                client_secret: configService.get('UPWORK_CLIENT_SECRET'),
                redirect_uri: configService.get('UPWORK_REDIRECT_URL')
            };
    
            const resp = await axios.post(
                'https://www.upwork.com/api/v3/oauth2/token',
                tokenParams,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
    
            return resp.data;
        } catch (error) {
            console.error('Error occurred in getUpworkAccessToken:', error);
            throw error;
        }
    }
    
}
