import axios from "axios";

const chatApiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

export const createFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await chatApiInstance.post("/api/chat/send", formData);
  return response.data;
};

export const askQuery = async ({ documentId, question }) => {
  const response = await chatApiInstance.post("/api/chat/ask", {
    documentId,
    question,
  });
  return response.data;
};