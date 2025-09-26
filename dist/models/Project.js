"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const mongoose_1 = require("mongoose");
const ProjectSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    team: { type: mongoose_1.Schema.Types.ObjectId, ref: "Team", required: true },
}, { timestamps: true });
exports.Project = (0, mongoose_1.model)("Project", ProjectSchema);
