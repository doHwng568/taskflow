import MainArea from "../../Area/pages/MainArea";

function MainWorkspace(props) {
    
  return (
    <>
      <h3 style={{ color: 'red' }}>Workspace</h3>

      <MainArea subject={props.subject} />
    </>
  );
}

export default MainWorkspace;