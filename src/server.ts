import dotenv from 'dotenv'
import { ParamsManagerService } from './services/ParamsManagerService';
import { JobsManagerService } from './services/JobsManagerService';

dotenv.config();
const paramsService = new ParamsManagerService();
const jobsManager = new JobsManagerService();

const _initializeServer = () => {
  paramsService.getParameters().then(result => {
    jobsManager.startJobs();
  })
}

_initializeServer();
