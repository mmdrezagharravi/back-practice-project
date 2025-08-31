import { Types } from "mongoose";
import { IUser } from "../models/User";
import { Team } from "../models/Team";
import { Project } from "../models/Project";
import { Task } from "../models/Task";

export const isAdmin = (user: IUser) => user.role === "ADMIN";
export const isManagerOrAdmin = (user: IUser) =>
  user.role === "ADMIN" || user.role === "MANAGER";

export const isTeamMember = async (
  userId: Types.ObjectId,
  teamId: Types.ObjectId
) => {
  return !!(await Team.exists({ _id: teamId, members: userId }));
};

export const canManageTeam = async (user: IUser, teamId: Types.ObjectId) => {
  if (isAdmin(user)) return true;
  const team = await Team.findById(teamId);
  if (!team) return false;
  return team.createdBy.toString() === user.id.toString();
};

export const hasProjectAccess = async (
  user: IUser,
  projectId: Types.ObjectId
) => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  return isAdmin(user) || isTeamMember(user.id, project.team as Types.ObjectId);
};

export const hasTaskAccess = async (user: IUser, taskId: Types.ObjectId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) return false;
  const project = task.project as any;
  return isAdmin(user) || isTeamMember(user.id, project.team);
};
