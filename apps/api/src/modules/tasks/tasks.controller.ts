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
import { TasksService } from './tasks.service';
import {
  CreateCommentDto,
  CreateTaskDto,
  CreateTimeEntryDto,
  ListTasksQueryDto,
  MoveTaskDto,
  UpdateTaskDto,
} from './dto/tasks.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks (paginated, filterable)' })
  findAll(@Query() query: ListTasksQueryDto, @CurrentUser() user: AuthUser) {
    return this.tasks.findAll(query, user);
  }

  @Get('board/:projectId')
  @ApiOperation({ summary: 'Kanban board for a project (tasks grouped by status)' })
  board(@Param('projectId', ParseUUIDPipe) projectId: string, @CurrentUser() user: AuthUser) {
    return this.tasks.board(projectId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task with comments, time entries, and files' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.tasks.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Create a task' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasks.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.update(id, dto, user);
  }

  @Patch(':id/move')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Move a task on the kanban board' })
  move(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasks.move(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a task' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.tasks.remove(id, user);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Comment on a task' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.addComment(id, dto, user);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete own comment' })
  removeComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.removeComment(id, commentId, user);
  }

  @Post(':id/time')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Log time on a task' })
  addTime(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTimeEntryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.addTimeEntry(id, dto, user);
  }

  @Delete(':id/time/:entryId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Delete own time entry' })
  removeTime(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.removeTimeEntry(id, entryId, user);
  }
}
