import { askQuery, createFile } from "../service/chat.api";

export const useChat = () => ({
  uploadDocument: createFile,
  askQuestion: askQuery,
});