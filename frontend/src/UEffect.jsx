import { useState, useEffect } from 'react'

function UEffect() {

    const [count, setCount] = useState(0)
    const [status, setStatus] = useState('')

    useEffect(() => {
        console.log('useEffect without dependency, run any time render')
    })

    useEffect(() => {
        console.log('useEffect with empty dependency, run only first time render')
    }, [])

    useEffect(() => {
        console.log('useEffect with dependency, run when count or status change')
    }, [count, status])

    return (
        <div>
            <p>Số lần render: {count}</p>
            <button onClick={() => setCount(count + 1)}>Tăng</button>
            <button onClick={() => setStatus('On')}>Bật</button>
            <button onClick={() => setStatus('Off')}>Tắt</button>
            <p>Trạng thái: {status}</p>
        </div>
    )
}

export default UEffect