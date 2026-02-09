'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import '../auth/auth.css';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const redirectTo = '/dashboard';

      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password, redirectTo }),
      });

      // Check if response is ok and has content
      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Signup failed' };
        }
        throw new Error(errorData.error || 'Signup failed');
      }

      // Parse JSON response
      const result = await res.json();

      // Check if email confirmation is required
      if (result.requiresEmailConfirmation) {
        toast.success('Signup successful! Please check your email to confirm your account.');
        router.push('/login');
      } else {
        // Auto-confirmed, logged in immediately
        toast.success('Account created successfully!');
        router.refresh(); // refresh session state
        router.push(result.redirectTo || '/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed.';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const redirectTo = `${window.location.origin}/api/auth/callback?next=/dashboard`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      toast.error('Google signup failed');
    }
  };

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        {/* Logo */}
        <div className='auth-logo'>
          <div className='auth-logo-image'>
            <Image
              src='/images/logo.png'
              alt='Imagination Trekker'
              width={120}
              height={120}
            />
          </div>
        </div>
        <div className='auth-tabs'>
          <div className='auth-tab-container'>
            <button className='auth-tab-button'>
              <Link href='/login'>Login</Link>
            </button>
            <button className='auth-tab-button active'>
              <Link href='/signup'>Signup</Link>
            </button>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className='auth-form'>
          {errors.general && <div className='auth-error'>{errors.general}</div>}

          <div className='auth-field'>
            <label className='auth-label'>Email</label>
            <input
              type='email'
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              placeholder='name@example.com'
              className='auth-input'
              disabled={isLoading}
            />
            {errors.email && (
              <p className='auth-error-message'>{errors.email}</p>
            )}
          </div>

          <div className='auth-field'>
            <label className='auth-label'>Password</label>
            <div className='auth-input-container'>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                placeholder='••••••••'
                className='auth-input password'
                disabled={isLoading}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='auth-password-toggle'
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className='auth-error-message'>{errors.password}</p>
            )}
          </div>

          <div className='auth-field confirm-password'>
            <label className='auth-label'>Confirm Password</label>
            <div className='auth-input-container'>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={e =>
                  handleInputChange('confirmPassword', e.target.value)
                }
                placeholder='••••••••'
                className='auth-input password'
                disabled={isLoading}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='auth-password-toggle'
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className='auth-error-message'>{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='auth-submit-button'
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Social Signup Button */}
          <button
            type='button'
            className='auth-social-button'
            onClick={handleGoogleSignUp}
            disabled={isLoading}
          >
            <div className='auth-social-icon'>G</div>
            <span className='auth-social-text'>Continue with Google</span>
          </button>

          {/* Footer */}
          <p className='auth-footer'>
            Already have an account?{' '}
            <Link href='/login' className='auth-footer-link'>
              Log in
            </Link>
          </p>
          <p className='auth-footer'>
            By signing up, you agree to our{' '}
            <span className='auth-footer-link'>Terms of Service</span> and{' '}
            <span className='auth-footer-link'>Privacy Policy</span>
          </p>
        </form>
      </div>
    </div>
  );
}
