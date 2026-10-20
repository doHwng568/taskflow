import { useAuthStore } from "../../../stores/authStore"

function MainCard() {

    const username = useAuthStore(state => state.username)

    return (
        <>
            <h3>Main Card</h3>
            <h4>Hello, {username}</h4>
        </>
    )
}

export default MainCard