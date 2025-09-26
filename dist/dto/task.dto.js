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
exports.TaskListQueryDto = exports.AssignTaskDto = exports.UpdateTaskDto = exports.CreateTaskDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const common_dto_1 = require("./common.dto");
class CreateTaskDto {
}
exports.CreateTaskDto = CreateTaskDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === "string" ? value.trim() : value)),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === "string" ? value.trim() : value)),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(common_dto_1.TaskStatusEnum),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "assigneeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)({}, { message: "dueDate must be ISO-8601 (e.g. 2025-01-31T10:00:00Z)" }),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "dueDate", void 0);
class UpdateTaskDto {
}
exports.UpdateTaskDto = UpdateTaskDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === "string" ? value.trim() : value)),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === "string" ? value.trim() : value)),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(common_dto_1.TaskStatusEnum),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "assigneeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)({}, { message: "dueDate must be ISO-8601" }),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "dueDate", void 0);
class AssignTaskDto {
}
exports.AssignTaskDto = AssignTaskDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], AssignTaskDto.prototype, "taskId", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], AssignTaskDto.prototype, "userId", void 0);
// برای Query.tasks (page/limit/status) – با پیش‌فرض‌های فعلی تو
class TaskListQueryDto {
    constructor() {
        this.page = 3;
        this.limit = 100;
    }
}
exports.TaskListQueryDto = TaskListQueryDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], TaskListQueryDto.prototype, "projectId", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => (value == null ? 3 : parseInt(value, 10))),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], TaskListQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => (value == null ? 100 : parseInt(value, 10))),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], TaskListQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(common_dto_1.TaskStatusEnum),
    __metadata("design:type", String)
], TaskListQueryDto.prototype, "status", void 0);
