import { ConfigService } from "@nestjs/config";
import { Sequelize } from "sequelize-typescript";
import pg from 'pg';
import { Users } from "../models/users.model";
import { Medicines } from "@common/models/medicines.model";
import { StrategyAndTreatment } from "@common/models/strategy-and-treatment";
import { ResearchObjectives } from "@common/models/research-objectives.model";

export const databaseProviders = [
    {
        provide: 'SEQUELIZE',
        useFactory: async (configService: ConfigService) => {
            const sequelize = new Sequelize({
                dialect: 'postgres',
                host: configService.get('DB_HOST'),
                port: configService.get('DB_PORT'),
                username: configService.get('DB_USER'),
                password: configService.get('DB_PASSWORD'),
                database: configService.get('DB_NAME'),
                dialectModule: pg,
                dialectOptions: configService.get('DB_CA_CERT')
                    ? {
                        ssl: {
                            ca: configService.get('DB_CA_CERT').split('\\n').join('\n')
                        }
                    }
                    : {},
                ssl: true,
                models: [
                    Users,
                    Medicines,
                    StrategyAndTreatment,
                    ResearchObjectives
                ]
            });

            if (configService.get("SYNC_DATABASE") === 'true') {
                await sequelize.sync({
                    force: false,
                    alter: true 
                });
            }
            
            return sequelize;
        },
        inject: [ConfigService]
    }
];