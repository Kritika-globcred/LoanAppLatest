
import Error from "next/error";

const CustomErrorComponent = (props) => {
  // Sentry.captureUnderscoreErrorException(contextData); // Sentry call removed
  console.error("Pages Router Error Caught (_error.jsx):", props);
  return <Error statusCode={props.statusCode} />;
};

CustomErrorComponent.getInitialProps = async (contextData) => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  // await Sentry.captureUnderscoreErrorException(contextData); // Sentry call removed

  // This will contain the status code of the response
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
