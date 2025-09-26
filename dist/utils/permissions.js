"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTaskAccess = exports.hasProjectAccess = exports.canManageTeam = exports.isTeamMember = exports.isManagerOrAdmin = exports.isAdmin = void 0;
const Team_1 = require("../models/Team");
const Project_1 = require("../models/Project");
const Task_1 = require("../models/Task");
const isAdmin = (user) => user.role === "ADMIN";
exports.isAdmin = isAdmin;
const isManagerOrAdmin = (user) => user.role === "ADMIN" || user.role === "MANAGER";
exports.isManagerOrAdmin = isManagerOrAdmin;
const isTeamMember = async (userId, teamId) => {
    return !!(await Team_1.Team.exists({ _id: teamId, members: userId }));
};
exports.isTeamMember = isTeamMember;
const canManageTeam = async (user, teamId) => {
    if ((0, exports.isAdmin)(user))
        return true;
    const team = await Team_1.Team.findById(teamId);
    if (!team)
        return false;
    return team.createdBy.toString() === user.id.toString();
};
exports.canManageTeam = canManageTeam;
const hasProjectAccess = async (user, projectId) => {
    const project = await Project_1.Project.findById(projectId);
    if (!project)
        return false;
    return (0, exports.isAdmin)(user) || (0, exports.isTeamMember)(user.id, project.team);
};
exports.hasProjectAccess = hasProjectAccess;
const hasTaskAccess = async (user, taskId) => {
    const task = await Task_1.Task.findById(taskId).populate("project");
    if (!task)
        return false;
    const project = task.project;
    return (0, exports.isAdmin)(user) || (0, exports.isTeamMember)(user.id, project.team);
};
exports.hasTaskAccess = hasTaskAccess;
