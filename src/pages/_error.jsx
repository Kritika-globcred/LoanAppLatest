
import Error from "next/error";

const CustomErrorComponent = (props) => {
  console.error("Pages Router Error Caught (_error.jsx):", props);
  return <Error statusCode={props.statusCode} />;
};

CustomErrorComponent.getInitialProps = async (contextData) => {
  // This will contain the status code of the response
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
