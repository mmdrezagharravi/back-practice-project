"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericIdDto = exports.UserIdDto = exports.TaskIdDto = exports.ProjectIdDto = exports.TeamIdDto = void 0;
const class_validator_1 = require("class-validator");
class TeamIdDto {
}
exports.TeamIdDto = TeamIdDto;
__decorate([
    (0, class_validator_1.IsMongoId)({ message: "Invalid teamId format" }),
    __metadata("design:type", String)
], TeamIdDto.prototype, "teamId", void 0);
class ProjectIdDto {
}
exports.ProjectIdDto = ProjectIdDto;
__decorate([
    (0, class_validator_1.IsMongoId)({ message: "Invalid projectId format" }),
    __metadata("design:type", String)
], ProjectIdDto.prototype, "projectId", void 0);
class TaskIdDto {
}
exports.TaskIdDto = TaskIdDto;
__decorate([
    (0, class_validator_1.IsMongoId)({ message: "Invalid taskId format" }),
    __metadata("design:type", String)
], TaskIdDto.prototype, "taskId", void 0);
class UserIdDto {
}
exports.UserIdDto = UserIdDto;
__decorate([
    (0, class_validator_1.IsMongoId)({ message: "Invalid userId format" }),
    __metadata("design:type", String)
], UserIdDto.prototype, "userId", void 0);
class GenericIdDto {
}
exports.GenericIdDto = GenericIdDto;
__decorate([
    (0, class_validator_1.IsMongoId)({ message: "Invalid id format" }),
    __metadata("design:type", String)
], GenericIdDto.prototype, "id", void 0);
