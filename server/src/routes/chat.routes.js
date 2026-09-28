import express from "express"
import multer from "multer"
import { askFromPDF, fileRelatedResponseGenerator } from "../controllers/chat.controller.js"

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({
    storage: storage
})


router.post("/send", upload.single("file"), fileRelatedResponseGenerator)

router.post("/ask", askFromPDF)



export default router