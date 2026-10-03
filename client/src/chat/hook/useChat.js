import { askQuery, createFile } from "../service/chat.api"


export const useChat = ()=> {
    const handleChat = async (formData)=> {
        const data = await createFile(formData)
        console.log(data)
    }

    const handleAskQuery = async ({query})=> {
        const data = await askQuery({query})
        console.log(data)
    }
    return {
        handleChat,
        handleAskQuery
    }
}