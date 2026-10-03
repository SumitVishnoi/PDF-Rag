import axios from "axios"

const chatApiInstance = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
})

export const createFile = async (formData)=> {
    const response = await chatApiInstance.post("/api/chat/send",formData)
    return response.data
}

export const askQuery = async ({query})=> {
    const response = await chatApiInstance.post("/api/chat/ask", {query})
    return response.data
}