"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = require("mongoose");
const TaskSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
        type: String,
        enum: ["TODO", "IN_PROGRESS", "DONE"],
        default: "TODO",
    },
    dueDate: { type: Date },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project", required: true },
    assignee: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    comments: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Comment" }],
}, { timestamps: true });
TaskSchema.index({ project: 1, createdAt: -1 });
exports.Task = (0, mongoose_1.model)("Task", TaskSchema);
