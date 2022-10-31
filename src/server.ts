import dotenv from 'dotenv'
import { ParamsManagerService } from './services/ParamsManagerService';
import { JobsManagerService } from './services/JobsManagerService/JobsManagerService';
import { HeartBeatService } from './services/HeartbeatService';

dotenv.config();
const paramsService: ParamsManagerService = new ParamsManagerService();
const jobsManager: JobsManagerService = new JobsManagerService();
const heartBeatSrvc: HeartBeatService = new HeartBeatService();

const _initializeServer = (): void => {
  paramsService.getParameters().then(result => {
    jobsManager.startJobs();
  });

  heartBeatSrvc.startHeartBeat();
}

_initializeServer();
