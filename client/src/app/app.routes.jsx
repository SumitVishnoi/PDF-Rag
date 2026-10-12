import { createBrowserRouter } from "react-router";
import Dashboard from "../chat/pages/Dashboard";


const router = createBrowserRouter([
    {
        path: "/",
        element: <Dashboard />
    }
])

export default router