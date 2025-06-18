import React, { useEffect, useRef } from 'react';
import { Input } from './input';
import { Button } from './button';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  onSendOTP: () => void;
  onVerifyOTP: () => void;
  isSending: boolean;
  isVerifying: boolean;
  countdown: number;
  error: string;
  phoneNumber: string;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  onSendOTP,
  onVerifyOTP,
  isSending,
  isVerifying,
  countdown,
  error,
  phoneNumber,
  disabled,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input when the component mounts or when value is empty
  useEffect(() => {
    if (value.length === 0 && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value.replace(/\D/g, '');
    
    if (newValue) {
      // Update the value at the current index
      const newOtp = value.split('');
      newOtp[index] = newValue[0];
      const finalOtp = newOtp.join('').slice(0, 4);
      onChange(finalOtp);
      
      // Move focus to the next input if available
      if (index < 3 && newValue) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Handle backspace
      const newOtp = value.split('');
      newOtp[index] = '';
      onChange(newOtp.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 4);
    if (pastedData) {
      onChange(pastedData);
      // Focus the last input with data
      const focusIndex = Math.min(pastedData.length, 3);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center justify-center space-x-3">
          {[0, 1, 2, 3].map((index) => (
            <Input
              key={index}
              ref={(el) => {
                if (el) {
                  inputRefs.current[index] = el;
                }
              }}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={value[index] || ''}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className={`h-16 w-16 text-2xl font-bold text-center p-0 bg-transparent border-2 border-gray-300 dark:border-gray-600 
                focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 
                transition-all duration-200 rounded-xl ${error ? 'border-red-500' : ''}`}
              disabled={disabled || isVerifying}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        <Button
          type="button"
          onClick={onVerifyOTP}
          disabled={isVerifying || value.length !== 4 || disabled}
          className={`w-48 h-12 text-base font-medium rounded-xl transition-all duration-200 ${
            value.length === 4 && !disabled 
              ? 'bg-primary hover:bg-primary/90' 
              : 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
          }`}
        >
          {isVerifying ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : 'Verify OTP'}
        </Button>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onSendOTP}
          disabled={isSending || countdown > 0 || disabled || !phoneNumber}
          className={`text-sm font-medium ${
            countdown > 0 ? 'text-muted-foreground' : 'text-primary hover:bg-transparent hover:underline'
          }`}
        >
          {isSending ? (
            'Sending OTP...'
          ) : countdown > 0 ? (
            `Resend OTP in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`
          ) : (
            "Didn't receive code? Resend OTP"
          )}
        </Button>
        
        {error && (
          <p className="text-sm text-red-500 text-center px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            {error}
          </p>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        A 4-digit OTP has been sent to your WhatsApp number
      </p>
    </div>
  );
};
