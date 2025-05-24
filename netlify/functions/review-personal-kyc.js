const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Check for required environment variables
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    // Parse the incoming request body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
      console.log('Parsed request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body', details: parseError.message })
      };
    }
    
    // Initialize the Google Generative AI with your API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Your existing logic for processing KYC documents
    // ...
    
    // Example response - replace with your actual logic
    const response = {
      status: 'success',
      message: 'KYC processing started',
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending response:', JSON.stringify(response, null, 2));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error processing KYC:', error);
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        error: error.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
