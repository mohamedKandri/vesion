import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ProjectsService } from './projects.service';
import {
  AddMemberDto,
  CreateMilestoneDto,
  CreateProjectDto,
  ListProjectsQueryDto,
  UpdateMilestoneDto,
  UpdateProjectDto,
} from './dto/projects.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects (clients: own company only)' })
  findAll(@Query() query: ListProjectsQueryDto, @CurrentUser() user: AuthUser) {
    return this.projects.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project with members and milestones' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.projects.findOne(id, user);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Project timeline (milestones + dated tasks)' })
  timeline(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.projects.timeline(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a project' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthUser) {
    return this.projects.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a project' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projects.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a project' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.remove(id);
  }

  @Post(':id/members')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Add or update a project member' })
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projects.addMember(id, dto, user);
  }

  @Delete(':id/members/:userId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remove a project member' })
  removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.projects.removeMember(id, userId);
  }

  @Post(':id/milestones')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Add a milestone' })
  addMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMilestoneDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projects.addMilestone(id, dto, user);
  }

  @Patch(':id/milestones/:milestoneId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update a milestone' })
  updateMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.projects.updateMilestone(id, milestoneId, dto);
  }

  @Delete(':id/milestones/:milestoneId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a milestone' })
  removeMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    return this.projects.removeMilestone(id, milestoneId);
  }
}
