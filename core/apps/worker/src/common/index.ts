import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';

const config: ClientsModuleOptions = [
  {
    name: COMMUNICATIONS_CLIENT.CORE,
    transport: Transport.TCP,
    options: {
      host: process.env.CORE_MICRO_SERVICE_HOST,
      port: +process.env.CORE_MICRO_SERVICE_PORT,
    },
  },
  {
    name: COMMUNICATIONS_CLIENT.INCIDENT,
    transport: Transport.TCP,
    options: {
      host: process.env.INCIDENT_MICRO_SERVICE_HOST,
      port: +process.env.INCIDENT_MICRO_SERVICE_PORT,
    },
  },
];

export default config;

export * from './interfaces';
