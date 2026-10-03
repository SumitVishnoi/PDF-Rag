import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    file: {
        type: String,
    }
})

const chatModel = mongoose.model("chat", chatSchema)

export default chatModel