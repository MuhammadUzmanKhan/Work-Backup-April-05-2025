import { Module } from '@nestjs/common';
import { MedicinesService } from './medicine.service';
import { MedicinesController } from './medicine.controller';

@Module({
    imports: [],
    controllers: [MedicinesController],
    providers: [MedicinesService]
})
export class MedicinesModule {}
