import { Schema, model, Document, Types } from "mongoose";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: Date;
  project: Types.ObjectId;
  assignee?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comments: Types.ObjectId[];
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"],
      default: "TODO",
    },
    dueDate: { type: Date },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

TaskSchema.index({ project: 1, createdAt: -1 });

export const Task = model<ITask>("Task", TaskSchema);
