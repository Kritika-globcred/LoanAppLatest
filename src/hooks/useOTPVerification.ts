import { useState } from 'react';
import { sendOTP, verifyOTP } from '@/services/wati-service';

export const useOTPVerification = () => {
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const startCountdown = () => {
    setCountdown(300); // 5 minutes in seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  };

  const handleSendOTP = async (phoneNumber: string) => {
    if (isSending) return;
    
    setIsSending(true);
    setError('');
    
    try {
      const result = await sendOTP(phoneNumber);
      if (result.success) {
        setOtpSent(true);
        startCountdown();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error('Error sending OTP:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async (phoneNumber: string, otp: string) => {
    if (isVerifying) return;
    
    setIsVerifying(true);
    setError('');
    
    try {
      const result = await verifyOTP(phoneNumber, otp);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
      console.error('Error verifying OTP:', err);
      return { success: false, message: 'Verification failed' };
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    isSending,
    isVerifying,
    otpSent,
    countdown,
    error,
    sendOTP: handleSendOTP,
    verifyOTP: handleVerifyOTP,
  };
};
