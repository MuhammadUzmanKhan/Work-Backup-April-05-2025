import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SOURCE } from '../constants/source';

export type CompaniesDataDocument = HydratedDocument<CompaniesData>;

@Schema({ timestamps: true })
export class CompaniesData {
    @Prop()
    source: SOURCE;

    @Prop()
    bidUrl: string;

    @Prop()
    linkedinProfileUrl: string;

    @Prop()
    bidProfile: string;

    @Prop()
    userId: string;

    @Prop()
    rawHtml: string;

    @Prop()
    contactInfoPopupRawHtml: string
}

export const CompaniesDataSchema = SchemaFactory.createForClass(CompaniesData);