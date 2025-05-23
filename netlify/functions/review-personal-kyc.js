const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  try {
    // Parse the incoming request body
    const body = JSON.parse(event.body);
    
    // Initialize the Google Generative AI with your API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Your existing logic for processing KYC documents
    // ...
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'KYC processed successfully' }),
    };
  } catch (error) {
    console.error('Error processing KYC:', error);
    
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({
        error: error.message || 'Internal Server Error',
      }),
    };
  }
};
