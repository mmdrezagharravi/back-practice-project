import { Schema, model, Document, Types } from "mongoose";

export interface IProject extends Document {
  name: string;
  team: Types.ObjectId;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
  },
  { timestamps: true }
);

export const Project = model<IProject>("Project", ProjectSchema);
