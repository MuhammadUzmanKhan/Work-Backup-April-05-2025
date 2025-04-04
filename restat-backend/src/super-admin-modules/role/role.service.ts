import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ROLES } from 'src/common/constants/roles';
import FirebaseService from 'src/common/firebase/firebase.service';
import { Users } from 'src/common/models/users.model';

@Injectable()
export class RoleService {

    public async createSuperUser() {
        try {
            const configService = new ConfigService();
            const alreadySuperUser = await Users.findOne({ where: { role: ROLES.SUPER_ADMIN } });

            if (alreadySuperUser) throw {
                message: "Super user already exists",
            }

            const { additionalInformation: { uid, email, displayName } } = await FirebaseService.createSuperUser(
                configService.get("SUPER_USER_EMAIL"),
                configService.get("SUPER_USER_PASSWORD"),
                configService.get("SUPER_USER_DISPLAY_NAME"),
            );

            await Users.create({
                uid,
                email,
                provider: 'auto_generated',
                name: displayName,
                role: ROLES.SUPER_ADMIN
            });

        } catch (err) {
            console.error("error creating super admin", err);
        }
    }
}
