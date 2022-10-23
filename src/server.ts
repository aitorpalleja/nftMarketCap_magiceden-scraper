import dotenv from 'dotenv'
import { ParamsManagerService } from './services/ParamsManagerService';
import { JobsManagerService } from './services/JobsManagerService';

dotenv.config();
const paramsService: ParamsManagerService = new ParamsManagerService();
const jobsManager: JobsManagerService = new JobsManagerService();

const _initializeServer = (): void => {
  paramsService.getParameters().then(result => {
    jobsManager.startJobs();
  })
}

_initializeServer();
