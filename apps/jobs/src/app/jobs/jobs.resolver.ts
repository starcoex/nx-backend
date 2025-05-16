import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { ExecuteJobInput } from './dto/execute-job.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@nx-backend/graphql';

@Resolver()
export class JobsResolver {
  constructor(private jobsService: JobsService) {}

  @Query(() => [Job], { name: 'jobs' })
  @UseGuards(GqlAuthGuard)
  async getJobs() {
    return this.jobsService.getJobs();
  }

  @Mutation(() => Job)
  async executeJob(@Args('executeJobInput') executeJobInput: ExecuteJobInput) {
    return this.jobsService.executeJob(executeJobInput.name);
  }
}
