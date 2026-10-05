import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    // Unique ID for the uploaded document
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Original PDF name
    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    // ImageKit PDF URL
    url: {
      type: String,
      required: true,
    },

    // PDF processing status
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },

    // Total chunks stored in Pinecone
    totalChunks: {
      type: Number,
      default: 0,
    },

    // Chat history
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },

        content: {
          type: String,
          required: true,
          trim: true,
        },

        // Optional: store which chunks were used
        sources: [
          {
            chunkIndex: {
              type: Number,
            },

            score: {
              type: Number,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const chatModel = mongoose.model("Chat", chatSchema);

export default chatModel;