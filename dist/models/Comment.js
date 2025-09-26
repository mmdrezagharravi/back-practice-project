"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const CommentSchema = new mongoose_1.Schema({
    text: { type: String, required: true },
    author: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    task: { type: mongoose_1.Schema.Types.ObjectId, ref: "Task", required: true },
}, { timestamps: true });
exports.Comment = (0, mongoose_1.model)("Comment", CommentSchema);
