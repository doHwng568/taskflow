import MainArea from '../../area/pages/MainArea'

function MainWorkspace() {

    console.log("MainWorkspace rendered");

    return (
        <>
            <h3 style={{ color: 'red' }}>Workspace</h3>
            <MainArea />
        </>
    );
}

export default MainWorkspace;