export * from './discovery.service';
import { DiscoveryService } from './discovery.service';
export * from './jobs.service';
import { JobsService } from './jobs.service';
export const APIS = [DiscoveryService, JobsService];
