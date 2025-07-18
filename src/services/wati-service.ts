import { getDb } from '@/lib/firebase';
import { doc, collection, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Get the customer database instance
const db = getDb('customer');

const WATI_API_ENDPOINT = 'https://live-mt-server.wati.io/448542';
const WATI_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMjM5M2ExYS0yYjY3LTQyYTItYjgyOC0xNGMyMTU2NGI3M2YiLCJ1bmlxdWVfbmFtZSI6ImFuYWx5dGljc0BnbG9iY3JlZC5vcmciLCJuYW1laWQiOiJhbmFseXRpY3NAZ2xvYmNyZWQub3JnIiwiZW1haWwiOiJhbmFseXRpY3NAZ2xvYmNyZWQub3JnIiwiYXV0aF90aW1lIjoiMDcvMTEvMjAyNSAwNDo0NTo1NSIsInRlbmFudF9pZCI6IjQ0ODU0MiIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.SRgCojBfSLOmsdwcjjkYMiox9N7maTu-j6zhIVVIdXc';

// Define response type with optional error details
type OTPResponse = {
  success: boolean;
  message: string;
  isRetryable?: boolean;
  error?: {
    name: string;
    message: string;
    stack?: string;
    status?: number;
  };
};

// Generate a random 4-digit OTP
const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const sendOTP = async (phoneNumber: string): Promise<OTPResponse> => {
  console.log('[WATI] Sending OTP to:', phoneNumber);
  
  // Generate a 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  console.log('[WATI] Generated OTP:', otp);
  
  // Create OTP document in Firestore with 5-minute expiration
  const otpDocRef = doc(collection(db, 'otps'), phoneNumber);
  const otpData = {
    otp,
    phoneNumber,
    used: false,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    createdAt: serverTimestamp(),
  };
  
  try {
    // Store OTP in Firestore
    await setDoc(otpDocRef, otpData, { merge: true });
    console.log('[WATI] OTP stored in Firestore');
    
    // Clean the phone number
    const cleanPhoneNumber = phoneNumber.replace(/[\s+()-]/g, '');
    
    // Prepare the request body - matching the Zoho format
    const requestBody = {
      template_name: 'loanappotp',
      broadcast_name: 'zoho_auto_loanappotp',
      parameters: JSON.stringify([
        { name: '1', value: otp }  // Using '1' as the parameter name to match the template
      ])
    };

    console.log('[WATI] Sending request to WATI API:', {
      url: `https://live-mt-server.wati.io/448542/api/v1/sendTemplateMessage/${cleanPhoneNumber}?SourceType=ZOHO`,
      body: requestBody
    });
    
    // Send OTP via WATI - using the correct endpoint format from Zoho example
    const response = await fetch(
      `https://live-mt-server.wati.io/448542/api/v1/sendTemplateMessage/${cleanPhoneNumber}?SourceType=ZOHO`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WATI_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );
      
    console.log('[WATI] WATI API response status:', response.status);

    const contentType = response.headers.get('content-type');
    const responseText = await response.text();
    console.log('[WATI] Raw response text:', responseText);
    
    let responseData;
    try {
      responseData = contentType?.includes('application/json')
        ? JSON.parse(responseText)
        : { message: responseText };
      
      console.log('[WATI] Parsed response data:', responseData);
      
      // Check for success based on response status and any success indicators in the response
      if (response.ok) {
        // Check for various possible success indicators in the response
        const isSuccess = responseData?.result || 
                         responseData?.success || 
                         responseData?.sent || 
                         responseData?.status === 'success';
        
        if (isSuccess) {
          console.log('[WATI] OTP sent successfully');
          return { 
            success: true, 
            message: responseData?.message || 'OTP sent successfully',
            isRetryable: false
          };
        }
      }
      
      // Log the complete response for debugging
      console.log('[WATI] Full API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData
      });
      
      // Handle API errors with more detailed messages
      const errorMessage = responseData?.message || 
                          responseData?.error || 
                          responseData?.statusText || 
                          `Failed to send OTP (HTTP ${response.status})`;
      console.error('[WATI] API Error:', errorMessage);
      
      // Special handling for 500 errors
      if (response.status === 500) {
        console.log('[WATI] Server error, checking response body:', responseData);
        // Return a more specific error for 500s
        return {
          success: false,
          message: 'Temporary service issue. Please try again in a few minutes.',
          isRetryable: true,
          error: {
            name: 'WATIServerError',
            message: errorMessage,
            status: response.status
          }
        };
      }
      
      // For other errors, return structured error
      return {
        success: false,
        message: errorMessage,
        isRetryable: response.status !== 400, // Don't retry on bad requests
        error: {
          name: 'WATIApiError',
          message: errorMessage,
          status: response.status
        }
      };
      
    } catch (parseError) {
      console.error('[WATI] Error parsing response:', parseError);
      // Return a structured error for parse errors
      return {
        success: false,
        message: 'Invalid response from OTP service',
        isRetryable: true,
        error: {
          name: 'ParseError',
          message: 'Could not process the response from the server',
          status: response.status
        }
      };
    }
    
  } catch (error) {
    console.error('[WATI] Error in WATI API call:', error);
    
    // Clean up OTP document on any error
    try {
      await deleteDoc(otpDocRef);
      console.log('[WATI] Cleaned up OTP document after error');
    } catch (deleteError) {
      console.error('[WATI] Error cleaning up OTP:', deleteError);
    }
    
    // Provide user-friendly error message
    let errorMessage = 'Failed to send OTP. Please try again later.';
    let errorName = 'UnknownError';
    let isRetryable = true;
    
    if (error instanceof Error) {
      errorName = error.name;
      
      if (error.message.includes('Failed to send OTP (HTTP 500)')) {
        errorMessage = 'Temporary server issue. Please try again in a few minutes.';
      } else if (error.message.includes('Failed to send OTP (HTTP 4')) {
        errorMessage = 'Invalid request. Please check the phone number and try again.';
        isRetryable = false;
      } else if (error.message.includes('Failed to send OTP (HTTP 5')) {
        errorMessage = 'Service unavailable. Please try again later.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { 
      success: false, 
      message: errorMessage,
      isRetryable,
      error: {
        name: errorName,
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && error instanceof Error 
          ? { stack: error.stack } 
          : {})
      }
    };
  }
};

export const verifyOTP = async (phoneNumber: string, userOTP: string): Promise<{ success: boolean; message: string }> => {
  try {
    const otpRef = doc(collection(db, 'otps'), phoneNumber);
    const otpDoc = await getDoc(otpRef);
    
    if (!otpDoc.exists()) {
      return { success: false, message: 'OTP not found or expired' };
    }
    
    const otpData = otpDoc.data();
    const now = new Date();
    
    if (otpData.used) {
      return { success: false, message: 'OTP has already been used' };
    }
    
    if (otpData.expiresAt.toDate() < now) {
      return { success: false, message: 'OTP has expired' };
    }
    
    if (otpData.otp === userOTP) {
      // Mark OTP as used
      await setDoc(otpRef, { 
        used: true,
        verifiedAt: serverTimestamp() 
      }, { merge: true });
      return { success: true, message: 'OTP verified successfully' };
    } else {
      return { success: false, message: 'Invalid OTP' };
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { 
      success: false, 
      message: 'An error occurred while verifying OTP' 
    };
  }
};
