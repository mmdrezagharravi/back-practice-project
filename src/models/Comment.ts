import { Schema, model, Document, Types } from "mongoose";

export interface IComment extends Document {
  text: string;
  author: Types.ObjectId;
  task: Types.ObjectId;
}

const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
  },
  { timestamps: true }
);

export const Comment = model<IComment>("Comment", CommentSchema);
