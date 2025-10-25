import { IResolvers } from "@graphql-tools/utils";
import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from "apollo-server-express";
import { Types } from "mongoose";

import { User } from "../models/User";
import { Team } from "../models/Team";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { Comment } from "../models/Comment";

import { ForbiddenError, NotFoundError } from "../utils/error";
import { signToken, requireAuth, requireRole } from "../middleware/auth";
import {
  canManageTeam,
  hasProjectAccess,
  hasTaskAccess,
  isTeamMember,
} from "../utils/permissions";

import { validateDTO } from "../utils/validate";

import { RegisterDto, LoginDto } from "../dto/auth.dto";
import { UpdateUserDto } from "../dto/user.dto";
import {
  CreateTeamDto,
  AddUserToTeamDto,
  RemoveUserFromTeamDto,
} from "../dto/team.dto";
import { CreateProjectDto } from "../dto/project.dto";
import {
  CreateTaskDto,
  UpdateTaskDto,
  AssignTaskDto,
  TaskListQueryDto,
} from "../dto/task.dto";
import { TeamIdDto, ProjectIdDto, GenericIdDto } from "../dto/params.dto";
import { AddCommentDto } from "../dto/comment.dto";

interface Context {
  user: any | null;
}

export const resolvers: IResolvers<any, Context> = {
  Query: {
    me: async (_p, _a, { user }) => {
      console.log(`parent : ${_p} , 
args : ${_a}`);
      return user || null;
    },

    users: async (_p, _a, { user }) => {
      requireRole(user, ["ADMIN"]);
      return User.find({});
    },

    teams: async (_p, _a, { user }) => {
      requireAuth(user);
      if (user.role === "ADMIN") {
        return Team.find({});
      }
      if (user.role === "MANAGER") {
        return Team.find({ members: user._id });
      }
      throw ForbiddenError();
    },

    projects: async (_p, { teamId }, { user }) => {
      requireAuth(user);
      const dto = await validateDTO(TeamIdDto, { teamId });

      const team = await Team.findById(dto.teamId);
      if (!team) throw NotFoundError("Team");

      const isMember = await isTeamMember(user._id, team._id);
      if (!isMember && user.role !== "ADMIN") throw ForbiddenError();

      return Project.find({ team: dto.teamId });
    },

    tasks: async (_p, args, { user }) => {
      requireAuth(user);
      const dto = await validateDTO(TaskListQueryDto, args);

      const can = await hasProjectAccess(
        user,
        new Types.ObjectId(dto.projectId)
      );
      if (!can) throw ForbiddenError();

      const filter: any = { project: dto.projectId };
      if (user.role !== "ADMIN") {
        filter.assignee = user._id;
      }
      if (dto.status) filter.status = dto.status;

      const skip = (dto.page - 1) * dto.limit;
      const [items, totalItems] = await Promise.all([
        Task.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(dto.limit)
          .populate("assignee")
          .populate({ path: "project", populate: { path: "team" } }),
        Task.countDocuments(filter),
      ]);

      return {
        items,
        page: dto.page,
        limit: dto.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / dto.limit),
      };
    },

    task: async (_p, { id }, { user }) => {
      requireAuth(user);
      const { id: taskId } = await validateDTO(GenericIdDto, { id });

      const can = await hasTaskAccess(user, new Types.ObjectId(taskId));
      if (!can) throw NotFoundError("Task");

      return Task.findById(taskId)
        .populate("assignee")
        .populate({ path: "project", populate: { path: "team" } });
    },
  },

  Mutation: {
    register: async (_p, { input }) => {
      const dto = await validateDTO(RegisterDto, input);
      const exists = await User.findOne({ email: dto.email });
      if (exists) throw new ApolloError("Email already in use", "EMAIL_TAKEN");
      try {
        const user = await User.create(dto);
        const token = signToken(user);
        return { token, user };
      } catch (error: any) {
        if (error) {
          throw new ApolloError("Emaill already in use", "EMAIL_TAKEN");
        }
        throw error;
      }
    },

    login: async (_p, { email, password }) => {
      const dto = await validateDTO(LoginDto, { email, password });
      const user = await User.findOne({ email: dto.email });
      if (!user || !(await user.comparePassword(dto.password))) {
        throw new AuthenticationError("ایمیل یا رمز عبور اشتباه است");
      }
      const token = signToken(user);
      return { token, user };
    },

    updateUser: async (_p, { userId, name, role }, { user }) => {
      requireRole(user, ["ADMIN"]);
      const dto = await validateDTO(UpdateUserDto, { userId, name, role });

      const updateFields: any = {};
      if (dto.name !== undefined) updateFields.name = dto.name;
      if (dto.role !== undefined) updateFields.role = dto.role;

      const updatedUser = await User.findByIdAndUpdate(
        dto.userId,
        { $set: updateFields },
        { new: true }
      );
      if (!updatedUser) throw NotFoundError("User");
      return updatedUser;
    },

    createTeam: async (_p, { name }, { user }) => {
      requireRole(user, ["ADMIN", "MANAGER"]);
      const dto = await validateDTO(CreateTeamDto, { name });

      const exists = await Team.findOne({ name: dto.name });
      if (exists)
        throw new ApolloError("Team with this name already exists", "CONFLICT");

      const team = await Team.create({
        name: dto.name,
        members: [user._id],
        createdBy: user._id,
      });
      return team;
    },

    addUserToTeam: async (_p, { teamId, userId }, { user }) => {
      requireRole(user, ["ADMIN", "MANAGER"]);
      const dto = await validateDTO(AddUserToTeamDto, { teamId, userId });

      const can = await canManageTeam(user, new Types.ObjectId(dto.teamId));
      if (!can) throw ForbiddenError();

      const team = await Team.findById(dto.teamId);
      if (!team) throw NotFoundError("Team");

      const u = await User.findById(dto.userId);
      if (!u) throw NotFoundError("User");

      if (!team.members.find((m) => m.toString() === dto.userId)) {
        team.members.push(u._id);
        await team.save();
      }
      return team;
    },

    removeUserFromTeam: async (_p, { teamId, userId }, { user }) => {
      requireRole(user, ["ADMIN", "MANAGER"]);
      const dto = await validateDTO(RemoveUserFromTeamDto, { teamId, userId });

      const team = await Team.findById(dto.teamId);
      if (!team) throw NotFoundError("Team");

      const isMember = team.members.find((m) => m.toString() === dto.userId);
      if (!isMember)
        throw new ApolloError(
          "User is not a member of this team",
          "BAD_REQUEST"
        );

      team.members = team.members.filter((m) => m.toString() !== dto.userId);
      await team.save();

      return team.populate("members");
    },

    createProject: async (_p, { teamId, name }, { user }) => {
      requireRole(user, ["MANAGER", "ADMIN"]);
      const dto = await validateDTO(CreateProjectDto, { teamId, name });

      const exists = await Project.findOne({ name: dto.name });
      if (exists)
        throw new ApolloError(
          "Project with this name already exists",
          "CONFLICT"
        );

      const isMember = await isTeamMember(
        user._id,
        new Types.ObjectId(dto.teamId)
      );
      if (!isMember && user.role !== "ADMIN") throw ForbiddenError();

      return Project.create({ name: dto.name, team: dto.teamId });
    },

    createTask: async (_p, { projectId, input }, { user }) => {
      requireRole(user, ["MANAGER", "ADMIN"]);
      const { projectId: pid } = await validateDTO(ProjectIdDto, { projectId });
      const dto = await validateDTO(CreateTaskDto, input);

      const can = await hasProjectAccess(user, new Types.ObjectId(pid));
      if (!can) throw ForbiddenError();

      if (dto.assigneeId) {
        const project = await Project.findById(pid);
        if (!project) throw NotFoundError("Project");
        const member = await isTeamMember(
          new Types.ObjectId(dto.assigneeId),
          project.team as Types.ObjectId
        );
        if (!member)
          throw new ApolloError(
            "Assignee must be a team member",
            "BAD_REQUEST"
          );
      }

      const task = await Task.create({
        title: dto.title,
        description: dto.description,
        status: dto.status || "TODO",
        assignee: dto.assigneeId,
        project: pid,
        createdBy: user._id,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      });

      return (await task.populate("assignee")).populate({
        path: "project",
        populate: { path: "team" },
      });
    },

    assignTask: async (_p, { taskId, userId }, { user }) => {
      requireRole(user, ["MANAGER", "ADMIN"]);
      const dto = await validateDTO(AssignTaskDto, { taskId, userId });

      const task = await Task.findById(dto.taskId).populate("project");
      if (!task) throw NotFoundError("Task");

      const project = task.project as any;
      const member = await isTeamMember(
        new Types.ObjectId(dto.userId),
        project.team
      );
      if (!member)
        throw new ApolloError("Assignee must be a team member", "BAD_REQUEST");

      task.assignee = dto.userId as any;
      await task.save();
      return task.populate("assignee");
    },

    updateTask: async (_p, { id, input }, { user }) => {
      requireRole(user, ["ADMIN", "MANAGER"]);
      const { id: taskId } = await validateDTO(GenericIdDto, { id });
      const dto = await validateDTO(UpdateTaskDto, input);

      const can = await hasTaskAccess(user, new Types.ObjectId(taskId));
      if (!can) throw ForbiddenError();

      if (dto.assigneeId) {
        const t = await Task.findById(taskId).populate("project");
        if (!t) throw NotFoundError("Task");
        const project = t.project as any;
        const member = await isTeamMember(
          new Types.ObjectId(dto.assigneeId),
          project.team
        );
        if (!member)
          throw new ApolloError(
            "Assignee must be a team member",
            "BAD_REQUEST"
          );
      }

      const task = await Task.findByIdAndUpdate(
        taskId,
        {
          $set: {
            ...(dto.title !== undefined ? { title: dto.title } : {}),
            ...(dto.description !== undefined
              ? { description: dto.description }
              : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.assigneeId !== undefined
              ? { assignee: dto.assigneeId }
              : {}),
            ...(dto.dueDate !== undefined
              ? { dueDate: new Date(dto.dueDate) }
              : {}),
          },
        },
        { new: true }
      )
        .populate("assignee")
        .populate({ path: "project", populate: { path: "team" } });

      if (!task) throw NotFoundError("Task");
      return task;
    },

    deleteTask: async (_p, { id }, { user }) => {
      requireRole(user, ["ADMIN", "MANAGER"]);
      const { id: taskId } = await validateDTO(GenericIdDto, { id });

      const t = await Task.findById(taskId);
      if (!t) throw NotFoundError("Task");

      const can = await hasTaskAccess(user, new Types.ObjectId(taskId));
      if (!can) throw ForbiddenError();

      await Comment.deleteMany({ task: taskId });
      await Task.findByIdAndDelete(taskId);
      return true;
    },

    addComment: async (_p, { taskId, text }, { user }) => {
      requireAuth(user);
      const dto = await validateDTO(AddCommentDto, { taskId, text });

      const can = await hasTaskAccess(user, new Types.ObjectId(dto.taskId));
      if (!can) throw ForbiddenError();

      const Create = await Comment.create({
        text: dto.text,
        author: user._id,
        task: dto.taskId,
      });
      return (await Create.populate("author")).populate("task");
    },
  },

  User: {
    teams: async (parent) => Team.find({ members: parent._id }),
  },
  Team: {
    members: async (parent) => User.find({ _id: { $in: parent.members } }),
    projects: async (parent) => Project.find({ team: parent._id }),
    createdBy: async (parent) => User.findById(parent.createdBy),
  },
  Project: {
    team: async (parent) => Team.findById(parent.team),
    tasks: async (parent) => Task.find({ project: parent._id }),
  },
  Task: {
    project: async (parent) => Project.findById(parent.project),
    assignee: async (parent) =>
      parent.assignee ? User.findById(parent.assignee) : null,
    comments: async (parent) => Comment.find({ task: parent._id }),
  },
  Comment: {
    author: async (parent) => User.findById(parent.author),
    task: async (parent) => Task.findById(parent.task),
  },
};
