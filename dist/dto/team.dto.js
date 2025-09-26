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
exports.RemoveUserFromTeamDto = exports.AddUserToTeamDto = exports.CreateTeamDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateTeamDto {
}
exports.CreateTeamDto = CreateTeamDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === "string" ? value.trim() : value)),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "name", void 0);
class AddUserToTeamDto {
}
exports.AddUserToTeamDto = AddUserToTeamDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], AddUserToTeamDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], AddUserToTeamDto.prototype, "userId", void 0);
class RemoveUserFromTeamDto {
}
exports.RemoveUserFromTeamDto = RemoveUserFromTeamDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], RemoveUserFromTeamDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], RemoveUserFromTeamDto.prototype, "userId", void 0);
