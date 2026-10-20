function MainCard(props) {
  return (
    <>
      <h3 style={{ color: 'green' }}>Card</h3>
      <h3>Hello, {props.subject}</h3>
    </>
  );
}

export default MainCard;