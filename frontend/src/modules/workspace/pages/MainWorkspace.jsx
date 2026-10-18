import axios from "axios"
import { useEffect, useState } from "react"
import api from "../../../services/api"

function MainWorkspace() {

    // const [response, setResponse] = useState()

    // useEffect(() => {
    //     const fetchWorkspaceData = async () => {
    //         try {
    //             const res = await api.get('/workspace')
    //             console.log(res.data)
    //         } catch (err) {
    //             console.log(err)
    //         }
    //     }

    //     fetchWorkspaceData()
    // }, [])

    return (
        <>
            <h1>Workspace</h1>
        </>
    )

}

export default MainWorkspace