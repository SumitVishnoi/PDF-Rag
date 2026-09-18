import express from "express"
import cors from "cors"

const app = express()

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

app.get("/", (req, res)=> {
    res.json({
        status: 200,
        message: "OK"
    })
})



app.listen(8000, ()=> {
    console.log("server is running on port 8000")
})