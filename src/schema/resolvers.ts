import { IResolvers } from "@graphql-tools/utils";
import { ApolloError } from "apollo-server-express";
import { User } from "../models/User";
import { Team } from "../models/Team";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { Comment } from "../models/Comment";
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/error";
import { signToken, requireAuth, requireRole } from "../middleware/auth";
import {
  canManageTeam,
  hasProjectAccess,
  hasTaskAccess,
  isTeamMember,
} from "../utils/permissions";
import { Types } from "mongoose";

interface Context {
  user: any | null;
}

export const resolvers: IResolvers<any, Context> = {
  Query: {
    // Return current user info
    me: async (_p, _a, { user }) => user || null,

    // Return users list (ADMIN → all, MANAGER → team members)
    users: async (_p, _a, { user }) => {
      requireAuth(user);

      if (user.role === "ADMIN") return User.find({});

      if (user.role === "MANAGER") {
        const managerTeams = await Team.find({ members: user._id });
        const memberIds = new Set<string>();

        managerTeams.forEach((team) =>
          team.members.forEach((id) => memberIds.add(id.toString()))
        );

        return User.find({ _id: { $in: Array.from(memberIds) } });
      }

      throw new Error("Only admins and managers can view users.");
    },

    teams: async (_p, _a, { user }) => {
      requireAuth(user);

      if (user.role === "ADMIN") return Team.find({});
      if (user.role === "MANAGER") return Team.find({ members: user._id });

      throw new Error("Only admin and manager can access teams.");
    },

    // Return projects by team (if user is member or admin)
    projects: async (_p, { teamId }, { user }) => {
      requireAuth(user);

      if (!Types.ObjectId.isValid(teamId)) {
        throw ValidationError("Invalid teamId format");
      }

      const team = await Team.findById(teamId);
      if (!team) throw NotFoundError("Team");

      const isMember = await isTeamMember(user._id, team._id);
      if (!isMember && user.role !== "ADMIN") throw ForbiddenError();

      return Project.find({ team: teamId });
    },

  
    myProjects: async (_p, _a, { user }) => {
      requireAuth(user);

      const teams = await Team.find({ members: user._id });
      if (!teams.length) return [];

      const teamIds = teams.map((t) => t._id);
      const projects = await Project.find({ team: { $in: teamIds } }).populate("team");
      return projects;
    },

    // Return paginated tasks of a project
    tasks: async (_p, { projectId, page = 1, limit = 30, status }, { user }) => {
      requireAuth(user);

      const can = await hasProjectAccess(user, new Types.ObjectId(projectId));
      if (!can) throw new Error("Forbidden");

      const filter: any = { project: projectId };
      if (user.role === "MEMBER") filter.assignee = user._id;
      if (status) filter.status = status;

      const skip = (page - 1) * limit;
      const [items, totalItems] = await Promise.all([
        Task.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("assignee")
          .populate({ path: "project", populate: { path: "team" } }),
        Task.countDocuments(filter),
      ]);

      return {
        items,
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      };
    },

    // Return a single task by ID (with access check)
    task: async (_p, { id }, { user }) => {
      requireAuth(user);

      const can = await hasTaskAccess(user, new Types.ObjectId(id));
      if (!can) throw new Error("Task not found or forbidden");

      return Task.findById(id)
        .populate("assignee")
        .populate({ path: "project", populate: { path: "team" } });
    },

    // Return all tasks assigned to current user
    myTasks: async (_p, _a, { user }) => {
      requireAuth(user);

      return Task.find({ assignee: user._id })
        .populate("assignee")
        .populate({ path: "project", populate: { path: "team" } });
    },
  },

  Mutation: {
    // --- AUTH ---
    register: async (_p, { input }) => {
      const exists = await User.findOne({ email: input.email });
      if (exists) throw new Error("Email already in use");

      const user = await User.create(input);
      const token = signToken(user);
      return { token, user };
    },

    login: async (_p, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new ApolloError("User not found");
      const ok = await user.comparePassword(password);
      if (!ok) throw new ApolloError("Incorrect password");

      const token = signToken(user);
      return { token, user };
    },

    // --- USER MANAGEMENT ---
    updateUser: async (_p, { userId, name, role }, { user }) => {
      requireRole(user, ["ADMIN"]);

      const updateFields: any = {};
      if (name) updateFields.name = name;
      if (role) updateFields.role = role;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true }
      );

      if (!updatedUser) throw new Error("User not found");
      return updatedUser;
    },

    // --- TEAM MANAGEMENT ---
    createTeam: async (_p, { name, members }, { user }) => {
      requireAuth(user);

      const exists = await Team.findOne({ name });
      if (exists) throw new Error("Team with this name already exists");

      const membersToAdd = members || [];
      if (!membersToAdd.includes(user._id.toString())) {
        membersToAdd.push(user._id.toString());
      }

      return Team.create({
        name,
        members: membersToAdd,
        createdBy: user._id,
      });
    },

    addUserToTeam: async (_p, { teamId, userId }, { user }) => {
      requireRole(user, ["ADMIN", "MANAGER"]);

      const can = await canManageTeam(user, new Types.ObjectId(teamId));
      if (!can) throw new Error("Forbidden");

      const team = await Team.findById(teamId);
      if (!team) throw new Error("Team not found");

      const u = await User.findById(userId);
      if (!u) throw new Error("User not found");

      if (!team.members.includes(userId)) {
        team.members.push(u.id);
        await team.save();
      }

      return team;
    },

    removeUserFromTeam: async (_p, { teamId, userId }, { user }) => {
      requireRole(user, ["ADMIN", "MANAGER"]);

      const team = await Team.findById(teamId);
      if (!team) throw new Error("Team not found");

      if (!team.members.includes(userId)) {
        throw new Error("User is not a member of this team");
      }

      team.members = team.members.filter((m) => m.toString() !== userId);
      await team.save();

      return team.populate("members");
    },

    // --- PROJECT MANAGEMENT ---
    createProject: async (_p, { teamId, name }, { user }) => {
      requireRole(user, ["ADMIN", "MANAGER"]);

      const exists = await Project.findOne({ name });
      if (exists) throw new Error("Project with this name already exists");

      const isMember = await isTeamMember(user._id, new Types.ObjectId(teamId));
      if (!isMember && user.role !== "ADMIN" && user.role !== "MANAGER") {
        throw new Error("Forbidden");
      }

      return Project.create({ name, team: teamId });
    },

    // --- TASK MANAGEMENT ---
    createTask: async (_p, { projectId, input }, { user }) => {
      requireRole(user, ["MANAGER", "ADMIN"]);

      const can = await hasProjectAccess(user, new Types.ObjectId(projectId));
      if (!can) throw new Error("Forbidden");

      if (input.assigneeId) {
        const project = await Project.findById(projectId);
        if (!project) throw new Error("Project not found");

        const member = await isTeamMember(
          new Types.ObjectId(input.assigneeId),
          project.team as Types.ObjectId
        );

        if (!member) throw new Error("Assignee must be a team member");
      }

      const task = await Task.create({
        title: input.title,
        description: input.description,
        status: input.status || "TODO",
        assignee: input.assigneeId,
        project: projectId,
        createdBy: user._id,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });

      return (await task.populate("assignee")).populate({
        path: "project",
        populate: { path: "team" },
      });
    },

    assignTask: async (_p, { taskId, userId }, { user }) => {
      requireRole(user, ["MANAGER", "ADMIN"]);

      const task = await Task.findById(taskId).populate("project");
      if (!task) throw NotFoundError("Task");

      const project = task.project as any;
      const member = await isTeamMember(
        new Types.ObjectId(userId),
        project.team
      );

      if (!member) throw new Error("Assignee must be a team member");

      task.assignee = userId;
      await task.save();
      return task.populate("assignee");
    },

    updateTask: async (_p, { id, input }, { user }) => {
      requireAuth(user);

      const taskToUpdate = await Task.findById(id);
      if (!taskToUpdate) throw NotFoundError("Task");

      const isAssignee =
        taskToUpdate.assignee &&
        taskToUpdate.assignee.toString() === user._id.toString();

      const can = await hasTaskAccess(user, new Types.ObjectId(id));
      if (!isAssignee && !can) throw new Error("Access denied");

      if (input.assigneeId) {
        const project = await Project.findById(taskToUpdate.project);
        if (!project) throw NotFoundError("Project");

        const member = await isTeamMember(
          new Types.ObjectId(input.assigneeId),
          project.team as Types.ObjectId
        );

        if (!member) throw new Error("Assignee must be a team member");
      }

      const task = await Task.findByIdAndUpdate(
        id,
        {
          $set: {
            ...(input.title && { title: input.title }),
            ...(input.description && { description: input.description }),
            ...(input.status && { status: input.status }),
            ...(input.assigneeId && { assignee: input.assigneeId }),
            ...(input.dueDate && { dueDate: input.dueDate }),
            ...(input.comments && { comments: input.comments }),
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
      requireAuth(user);

      const task = await Task.findById(id);
      if (!task) throw NotFoundError("Task");

      const can = await hasTaskAccess(user, new Types.ObjectId(id));
      if (!can) throw new Error("Forbidden");

      await Comment.deleteMany({ task: id });
      await Task.findByIdAndDelete(id);

      return true;
    },

    addComment: async (_p, { taskId, text }, { user }) => {
      requireAuth(user);

      const can = await hasTaskAccess(user, new Types.ObjectId(taskId));
      if (!can) throw new Error("Access denied");

      const comment = await Comment.create({
        text,
        author: user._id,
        task: taskId,
      });

      return (await comment.populate("author")).populate("task");
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