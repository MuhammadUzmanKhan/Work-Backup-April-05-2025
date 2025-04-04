import { Module } from '@nestjs/common';
import { DynamicModelsProvider } from './dynamic-models.provider';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [MongooseModule.forFeatureAsync([])],
    providers: [DynamicModelsProvider],
    exports: [DynamicModelsProvider],
})
export class DynamicModelsModule { }
