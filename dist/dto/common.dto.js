"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatusEnum = exports.RoleEnum = void 0;
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["ADMIN"] = "ADMIN";
    RoleEnum["MANAGER"] = "MANAGER";
    RoleEnum["MEMBER"] = "MEMBER";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var TaskStatusEnum;
(function (TaskStatusEnum) {
    TaskStatusEnum["TODO"] = "TODO";
    TaskStatusEnum["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatusEnum["DONE"] = "DONE";
})(TaskStatusEnum || (exports.TaskStatusEnum = TaskStatusEnum = {}));
