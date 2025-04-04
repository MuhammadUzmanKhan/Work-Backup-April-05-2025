import {
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserCredentials } from './dto/user-credentials.dto';
import {
    INVALID_CREDENTIALS,
    INVALID_SUPER_ADMIN_KEY,
    Permissions,
    USER_ALREADY_EXISTS
} from '@common/types';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { ConfigService } from '@nestjs/config';
import { Users } from '@common/models/users.model';
import { Sequelize } from 'sequelize-typescript';
import { UpdateUserPermissionsDto } from './dto/update-permissions.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject("SEQUELIZE") private readonly sequelize: Sequelize,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    public async login(credentials: UserCredentials) {
        try {
            const user = await Users.findOne({ where: { email: credentials.email } });

            if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
                throw new UnauthorizedException(INVALID_CREDENTIALS);
            }

            const _user = user.toJSON();
            delete _user['password'];

            const token = this.jwtService.sign(user.id);

            return {
                user: _user,
                token
            };
        } catch (error) {
            throw new UnauthorizedException();
        }
    }

    public async createSuperAdmin(superAdminCredentials: CreateSuperAdminDto) {
        const secretKey = this.configService.get('SUPER_ADMIN_SECRET_KEY');

        if (superAdminCredentials.secretKey !== secretKey) throw new UnauthorizedException(INVALID_SUPER_ADMIN_KEY);

        const existingUser = await Users.findOne({ where: { email: superAdminCredentials.email } });

        if (existingUser) throw new ConflictException(USER_ALREADY_EXISTS);

        const admin = await Users.create({
            email: superAdminCredentials.email,
            password: await bcrypt.hash(superAdminCredentials.password, await bcrypt.genSalt()),
            name: superAdminCredentials.name,
            permissions: {
                [Permissions.SUPER_ADMIN]: true,
                [Permissions.MEDS]: false,
                [Permissions.EVIDENCE_GENERATION_FRAMEWORK]: false,
                [Permissions.EVIDENCE_GENERATION_PRIORITIES]: false,
                [Permissions.EVIDENCE_LITERATURE_LIBRARY]: false,
                [Permissions.RESEARCH_INITIATIVES]: false,
                [Permissions.RESEARCH_TEAMS]: false,
                isSetByAdmin: true
            }
        });
        const _admin = admin.toJSON();
        delete _admin['password'];

        return _admin;
    }

    public async updateUserPermissions(permissionsData: UpdateUserPermissionsDto) {
        const transaction = await this.sequelize.transaction();

        try {
            const user = await Users.findByPk(permissionsData.userId);

            if (!user) throw new NotFoundException('User Not Found!');

            user.permissions = {
                ...permissionsData.permissions,
                [Permissions.SUPER_ADMIN]: false,
                isSetByAdmin: true
            };
            await user.save();

            return user;
        } catch (error) {
            transaction.rollback();
            throw error;
        }
    }
}
