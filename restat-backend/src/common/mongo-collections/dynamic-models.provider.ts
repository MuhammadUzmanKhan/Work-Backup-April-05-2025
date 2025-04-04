import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Request } from 'express';
import { CompaniesData, CompaniesDataSchema } from './companies-data.model';

@Injectable({ scope: Scope.REQUEST })
export class DynamicModelsProvider {
    constructor(
        @Inject(REQUEST) private readonly request: Request,
        @InjectConnection() private readonly connection: Connection,
    ) { }

    getCompaniesModel(): Model<CompaniesData> {
        if (!this.request.user) throw "User not exists";
        const companyId = (this.request.user as any).companyId;
        return this.connection.model("company-" + companyId, CompaniesDataSchema, "company-" + companyId);
    }
}
