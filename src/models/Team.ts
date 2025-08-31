import { Schema, model, Document, Types } from "mongoose";

export interface ITeam extends Document {
  name: string;
  members: Types.ObjectId[];
  createdBy: Types.ObjectId;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Team = model<ITeam>("Team", TeamSchema);
