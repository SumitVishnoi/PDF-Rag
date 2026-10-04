import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "New Chat",
    },
    file: {
        type: String,
        fileName: String
    }
  },
  {
    timestamps: true,
  },
);

const chatModel = mongoose.model("Chat", chatSchema);

export default chatModel;