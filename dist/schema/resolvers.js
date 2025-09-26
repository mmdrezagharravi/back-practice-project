"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const mongoose_1 = require("mongoose");
const User_1 = require("../models/User");
const Team_1 = require("../models/Team");
const Project_1 = require("../models/Project");
const Task_1 = require("../models/Task");
const Comment_1 = require("../models/Comment");
const error_1 = require("../utils/error");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../utils/permissions");
const validate_1 = require("../utils/validate");
// DTOs
const auth_dto_1 = require("../dto/auth.dto");
const user_dto_1 = require("../dto/user.dto");
const team_dto_1 = require("../dto/team.dto");
const project_dto_1 = require("../dto/project.dto");
const task_dto_1 = require("../dto/task.dto");
const params_dto_1 = require("../dto/params.dto");
const comment_dto_1 = require("../dto/comment.dto");
exports.resolvers = {
    Query: {
        me: async (_p, _a, { user }) => user || null,
        users: async (_p, _a, { user }) => {
            (0, auth_1.requireRole)(user, ["ADMIN"]);
            return User_1.User.find({});
        },
        teams: async (_p, _a, { user }) => {
            (0, auth_1.requireAuth)(user); // قبلاً بدون پرانتز بود
            if (user.role === "ADMIN") {
                return Team_1.Team.find({});
            }
            if (user.role === "MANAGER") {
                return Team_1.Team.find({ members: user._id });
            }
            throw (0, error_1.ForbiddenError)();
        },
        projects: async (_p, { teamId }, { user }) => {
            (0, auth_1.requireAuth)(user);
            const dto = await (0, validate_1.validateDTO)(params_dto_1.TeamIdDto, { teamId });
            const team = await Team_1.Team.findById(dto.teamId);
            if (!team)
                throw (0, error_1.NotFoundError)("Team");
            const isMember = await (0, permissions_1.isTeamMember)(user._id, team._id);
            if (!isMember && user.role !== "ADMIN")
                throw (0, error_1.ForbiddenError)();
            return Project_1.Project.find({ team: dto.teamId });
        },
        tasks: async (_p, args, { user }) => {
            (0, auth_1.requireAuth)(user);
            const dto = await (0, validate_1.validateDTO)(task_dto_1.TaskListQueryDto, args);
            const can = await (0, permissions_1.hasProjectAccess)(user, new mongoose_1.Types.ObjectId(dto.projectId));
            if (!can)
                throw (0, error_1.ForbiddenError)();
            const filter = { project: dto.projectId };
            if (user.role !== "ADMIN") {
                // اگر ادمین نباشد فقط تسک‌های assign شده به خودش را می‌بیند
                filter.assignee = user._id;
            }
            if (dto.status)
                filter.status = dto.status;
            const skip = (dto.page - 1) * dto.limit;
            const [items, totalItems] = await Promise.all([
                Task_1.Task.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(dto.limit)
                    .populate("assignee")
                    .populate({ path: "project", populate: { path: "team" } }),
                Task_1.Task.countDocuments(filter),
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
            (0, auth_1.requireAuth)(user);
            const { id: taskId } = await (0, validate_1.validateDTO)(params_dto_1.GenericIdDto, { id });
            const can = await (0, permissions_1.hasTaskAccess)(user, new mongoose_1.Types.ObjectId(taskId));
            // برای جلوگیری از enumeration، اگر دسترسی نداری مثل not found پاسخ بده
            if (!can)
                throw (0, error_1.NotFoundError)("Task");
            return Task_1.Task.findById(taskId)
                .populate("assignee")
                .populate({ path: "project", populate: { path: "team" } });
        },
    },
    Mutation: {
        register: async (_p, { input }) => {
            const dto = await (0, validate_1.validateDTO)(auth_dto_1.RegisterDto, input);
            const exists = await User_1.User.findOne({ email: dto.email });
            if (exists)
                throw new apollo_server_express_1.ApolloError("Email already in use", "EMAIL_TAKEN");
            try {
                const user = await User_1.User.create(dto);
                const token = (0, auth_1.signToken)(user);
                return { token, user };
            }
            catch (e) {
                if (e?.code === 11000) {
                    throw new apollo_server_express_1.ApolloError("Email already in use", "EMAIL_TAKEN");
                }
                throw e;
            }
        },
        login: async (_p, { email, password }) => {
            const dto = await (0, validate_1.validateDTO)(auth_dto_1.LoginDto, { email, password });
            const user = await User_1.User.findOne({ email: dto.email });
            if (!user || !(await user.comparePassword(dto.password))) {
                throw new apollo_server_express_1.AuthenticationError("ایمیل یا رمز عبور اشتباه است"); // UNAUTHENTICATED
            }
            const token = (0, auth_1.signToken)(user);
            return { token, user };
        },
        updateUser: async (_p, { userId, name, role }, { user }) => {
            (0, auth_1.requireRole)(user, ["ADMIN"]);
            const dto = await (0, validate_1.validateDTO)(user_dto_1.UpdateUserDto, { userId, name, role });
            const updateFields = {};
            if (dto.name !== undefined)
                updateFields.name = dto.name;
            if (dto.role !== undefined)
                updateFields.role = dto.role;
            const updatedUser = await User_1.User.findByIdAndUpdate(dto.userId, { $set: updateFields }, { new: true });
            if (!updatedUser)
                throw (0, error_1.NotFoundError)("User");
            return updatedUser;
        },
        createTeam: async (_p, { name }, { user }) => {
            (0, auth_1.requireRole)(user, ["ADMIN", "MANAGER"]);
            const dto = await (0, validate_1.validateDTO)(team_dto_1.CreateTeamDto, { name });
            const exists = await Team_1.Team.findOne({ name: dto.name });
            if (exists)
                throw new apollo_server_express_1.ApolloError("Team with this name already exists", "CONFLICT");
            const team = await Team_1.Team.create({
                name: dto.name,
                members: [user._id],
                createdBy: user._id,
            });
            return team;
        },
        addUserToTeam: async (_p, { teamId, userId }, { user }) => {
            (0, auth_1.requireRole)(user, ["ADMIN", "MANAGER"]);
            const dto = await (0, validate_1.validateDTO)(team_dto_1.AddUserToTeamDto, { teamId, userId });
            const can = await (0, permissions_1.canManageTeam)(user, new mongoose_1.Types.ObjectId(dto.teamId));
            if (!can)
                throw (0, error_1.ForbiddenError)();
            const team = await Team_1.Team.findById(dto.teamId);
            if (!team)
                throw (0, error_1.NotFoundError)("Team");
            const u = await User_1.User.findById(dto.userId);
            if (!u)
                throw (0, error_1.NotFoundError)("User");
            if (!team.members.find((m) => m.toString() === dto.userId)) {
                team.members.push(u._id); // نگه‌داشتن نوع ObjectId
                await team.save();
            }
            return team;
        },
        removeUserFromTeam: async (_p, { teamId, userId }, { user }) => {
            (0, auth_1.requireRole)(user, ["ADMIN", "MANAGER"]);
            const dto = await (0, validate_1.validateDTO)(team_dto_1.RemoveUserFromTeamDto, { teamId, userId });
            const team = await Team_1.Team.findById(dto.teamId);
            if (!team)
                throw (0, error_1.NotFoundError)("Team");
            const isMember = team.members.find((m) => m.toString() === dto.userId);
            if (!isMember)
                throw new apollo_server_express_1.ApolloError("User is not a member of this team", "BAD_REQUEST");
            team.members = team.members.filter((m) => m.toString() !== dto.userId);
            await team.save();
            return team.populate("members");
        },
        createProject: async (_p, { teamId, name }, { user }) => {
            (0, auth_1.requireRole)(user, ["MANAGER"]);
            const dto = await (0, validate_1.validateDTO)(project_dto_1.CreateProjectDto, { teamId, name });
            const exists = await Project_1.Project.findOne({ name: dto.name });
            if (exists)
                throw new apollo_server_express_1.ApolloError("Project with this name already exists", "CONFLICT");
            const isMember = await (0, permissions_1.isTeamMember)(user._id, new mongoose_1.Types.ObjectId(dto.teamId));
            if (!isMember && user.role !== "ADMIN")
                throw (0, error_1.ForbiddenError)();
            return Project_1.Project.create({ name: dto.name, team: dto.teamId });
        },
        createTask: async (_p, { projectId, input }, { user }) => {
            (0, auth_1.requireAuth)(user);
            const { projectId: pid } = await (0, validate_1.validateDTO)(params_dto_1.ProjectIdDto, { projectId });
            const dto = await (0, validate_1.validateDTO)(task_dto_1.CreateTaskDto, input);
            const can = await (0, permissions_1.hasProjectAccess)(user, new mongoose_1.Types.ObjectId(pid));
            if (!can)
                throw (0, error_1.ForbiddenError)();
            if (dto.assigneeId) {
                const project = await Project_1.Project.findById(pid);
                if (!project)
                    throw (0, error_1.NotFoundError)("Project");
                const member = await (0, permissions_1.isTeamMember)(new mongoose_1.Types.ObjectId(dto.assigneeId), project.team);
                if (!member)
                    throw new apollo_server_express_1.ApolloError("Assignee must be a team member", "BAD_REQUEST");
            }
            const task = await Task_1.Task.create({
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
            (0, auth_1.requireRole)(user, ["MANAGER", "ADMIN"]); // اصلاح املای MANAGER
            const dto = await (0, validate_1.validateDTO)(task_dto_1.AssignTaskDto, { taskId, userId });
            const task = await Task_1.Task.findById(dto.taskId).populate("project");
            if (!task)
                throw (0, error_1.NotFoundError)("Task");
            const project = task.project;
            const member = await (0, permissions_1.isTeamMember)(new mongoose_1.Types.ObjectId(dto.userId), project.team);
            if (!member)
                throw new apollo_server_express_1.ApolloError("Assignee must be a team member", "BAD_REQUEST");
            task.assignee = dto.userId;
            await task.save();
            return task.populate("assignee");
        },
        updateTask: async (_p, { id, input }, { user }) => {
            (0, auth_1.requireRole)(user, ["ADMIN", "MANAGER"]);
            const { id: taskId } = await (0, validate_1.validateDTO)(params_dto_1.GenericIdDto, { id });
            const dto = await (0, validate_1.validateDTO)(task_dto_1.UpdateTaskDto, input);
            const can = await (0, permissions_1.hasTaskAccess)(user, new mongoose_1.Types.ObjectId(taskId));
            if (!can)
                throw (0, error_1.ForbiddenError)();
            if (dto.assigneeId) {
                const t = await Task_1.Task.findById(taskId).populate("project");
                if (!t)
                    throw (0, error_1.NotFoundError)("Task");
                const project = t.project;
                const member = await (0, permissions_1.isTeamMember)(new mongoose_1.Types.ObjectId(dto.assigneeId), project.team);
                if (!member)
                    throw new apollo_server_express_1.ApolloError("Assignee must be a team member", "BAD_REQUEST");
            }
            const task = await Task_1.Task.findByIdAndUpdate(taskId, {
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
            }, { new: true })
                .populate("assignee")
                .populate({ path: "project", populate: { path: "team" } });
            if (!task)
                throw (0, error_1.NotFoundError)("Task");
            return task;
        },
        deleteTask: async (_p, { id }, { user }) => {
            (0, auth_1.requireAuth)(user);
            const { id: taskId } = await (0, validate_1.validateDTO)(params_dto_1.GenericIdDto, { id });
            const t = await Task_1.Task.findById(taskId);
            if (!t)
                throw (0, error_1.NotFoundError)("Task");
            const can = await (0, permissions_1.hasTaskAccess)(user, new mongoose_1.Types.ObjectId(taskId));
            if (!can)
                throw (0, error_1.ForbiddenError)();
            await Comment_1.Comment.deleteMany({ task: taskId });
            await Task_1.Task.findByIdAndDelete(taskId);
            return true;
        },
        addComment: async (_p, { taskId, text }, { user }) => {
            (0, auth_1.requireAuth)(user);
            const dto = await (0, validate_1.validateDTO)(comment_dto_1.AddCommentDto, { taskId, text });
            const can = await (0, permissions_1.hasTaskAccess)(user, new mongoose_1.Types.ObjectId(dto.taskId));
            if (!can)
                throw (0, error_1.ForbiddenError)();
            const c = await Comment_1.Comment.create({
                text: dto.text,
                author: user._id,
                task: dto.taskId,
            });
            return (await c.populate("author")).populate("task");
        },
    },
    // Field resolvers (روابط)
    User: {
        teams: async (parent) => Team_1.Team.find({ members: parent._id }),
    },
    Team: {
        members: async (parent) => User_1.User.find({ _id: { $in: parent.members } }),
        projects: async (parent) => Project_1.Project.find({ team: parent._id }),
        createdBy: async (parent) => User_1.User.findById(parent.createdBy),
    },
    Project: {
        team: async (parent) => Team_1.Team.findById(parent.team),
        tasks: async (parent) => Task_1.Task.find({ project: parent._id }),
    },
    Task: {
        project: async (parent) => Project_1.Project.findById(parent.project),
        assignee: async (parent) => parent.assignee ? User_1.User.findById(parent.assignee) : null,
        comments: async (parent) => Comment_1.Comment.find({ task: parent._id }),
    },
    Comment: {
        author: async (parent) => User_1.User.findById(parent.author),
        task: async (parent) => Task_1.Task.findById(parent.task),
    },
};
