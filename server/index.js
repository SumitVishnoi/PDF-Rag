import "dotenv/config"
import app from "./src/app.js"
import connectDb from "./src/config/db.js"

connectDb()

app.listen(8000, ()=> {
    console.log("server is running on port 8000")
})