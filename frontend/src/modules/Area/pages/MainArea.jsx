import MainCard from "../../Card/pages/MainCard";

function MainArea(props) {

    return (
        <>
            <h3 style={{ color: 'blue' }}>Area</h3>
            <MainCard subject={props.subject} />
        </>
    );
}

export default MainArea;