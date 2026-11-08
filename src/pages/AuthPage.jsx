
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  function clearErrors() {
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setGeneralError('');
    setMessage('');
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    clearErrors();
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.trim()
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearErrors();

    let valid = true;

    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(
        'Password must be at least 6 characters.'
      );
      valid = false;
    }

    if (isSignup && password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          navigate('/create-character', {
            replace: true,
          });
        } else {
          setMessage(
            'Account created! Check your email to confirm your account, then sign in.'
          );
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) throw error;

        navigate('/village', { replace: true });
      }
    } catch (err) {
      const errorMessage = err.message || '';
      const lowerMessage = errorMessage.toLowerCase();

      if (lowerMessage.includes('email not confirmed')) {
        setEmailError(
          'Please confirm your email before signing in.'
        );
      } else if (
        lowerMessage.includes('invalid login credentials')
      ) {
        setGeneralError(
          'Incorrect email or password. Please try again.'
        );
      } else if (lowerMessage.includes('rate limit')) {
        setGeneralError(
          'Too many attempts. Please wait a little while before trying again.'
        );
      } else if (
        lowerMessage.includes('email') ||
        lowerMessage.includes('already registered')
      ) {
        setEmailError(errorMessage);
      } else if (lowerMessage.includes('password')) {
        setPasswordError(errorMessage);
      } else {
        setGeneralError(
          errorMessage ||
            'Something went wrong. Try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">

      {/* Guildhaven Title with Pixel Tulip */}
      <div className="mb-10 flex items-center justify-center gap-3 sm:gap-4">
        <img
          src="/favicon.svg"
          alt="Pink pixel tulip"
          className="h-12 w-12 shrink-0 object-contain sm:h-16 sm:w-16"
          style={{ imageRendering: 'pixelated' }}
        />

        <h1 className="font-display text-5xl font-bold text-forest sm:text-7xl">
          Guildhaven
        </h1>
      </div>

      {/* Authentication Card */}
      <div className="w-full max-w-lg rounded-md border-4 border-bark bg-[#fff8e9] p-7 shadow-[6px_6px_0px_#725238]">

        <h2 className="mb-2 text-center font-display text-2xl text-bark">
          {isSignup ? 'Join the Guild' : 'Welcome Back'}
        </h2>

        <p className="mb-6 text-center text-xl text-bark">
          {isSignup
            ? 'Create your account and begin your journey.'
            : 'Sign in to continue your adventure.'}
        </p>

        {/* Sign In / Sign Up Tabs */}
        <div className="mb-7 flex gap-3">
          {[
            {
              id: 'signin',
              label: 'Sign In',
              bg: '#A9D8B8',
            },
            {
              id: 'signup',
              label: 'Sign Up',
              bg: '#F4AFC4',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchMode(tab.id)}
              aria-pressed={mode === tab.id}
              className="flex-1 rounded-sm border-[3px] border-bark px-4 py-3 font-display text-sm transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] motion-reduce:transform-none"
              style={{
                backgroundColor:
                  mode === tab.id
                    ? tab.bg
                    : '#F3E6CD',
                boxShadow:
                  mode === tab.id
                    ? '3px 3px 0px #725238'
                    : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Authentication Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-display text-sm text-bark"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
                setGeneralError('');
              }}
              aria-invalid={Boolean(emailError)}
              aria-describedby={
                emailError
                  ? 'email-error'
                  : undefined
              }
              placeholder="adventurer@example.com"
              className={`w-full rounded-sm border-[3px] bg-[#f8eed6] px-4 py-3 text-bark outline-none ${
                emailError
                  ? 'border-red-500'
                  : 'border-bark focus:border-forest'
              }`}
            />

            {emailError && (
              <p
                id="email-error"
                role="alert"
                className="mt-2 text-sm text-red-700"
              >
                {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-display text-sm text-bark"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={
                isSignup
                  ? 'new-password'
                  : 'current-password'
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
                setGeneralError('');
              }}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={
                passwordError
                  ? 'password-error'
                  : undefined
              }
              placeholder="Enter your password"
              className={`w-full rounded-sm border-[3px] bg-[#f8eed6] px-4 py-3 text-bark outline-none ${
                passwordError
                  ? 'border-red-500'
                  : 'border-bark focus:border-forest'
              }`}
            />

            {passwordError && (
              <p
                id="password-error"
                role="alert"
                className="mt-2 text-sm text-red-700"
              >
                {passwordError}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          {isSignup && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block font-display text-sm text-bark"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmError('');
                }}
                aria-invalid={Boolean(confirmError)}
                aria-describedby={
                  confirmError
                    ? 'confirm-password-error'
                    : undefined
                }
                placeholder="Confirm your password"
                className={`w-full rounded-sm border-[3px] bg-[#f8eed6] px-4 py-3 text-bark outline-none ${
                  confirmError
                    ? 'border-red-500'
                    : 'border-bark focus:border-forest'
                }`}
              />

              {confirmError && (
                <p
                  id="confirm-password-error"
                  role="alert"
                  className="mt-2 text-sm text-red-700"
                >
                  {confirmError}
                </p>
              )}
            </div>
          )}

          {/* Authentication Error */}
          {generalError && (
            <p
              role="alert"
              className="rounded-sm border-2 border-red-500 bg-red-50 p-3 text-sm text-red-800"
            >
              {generalError}
            </p>
          )}

          {/* Success Message */}
          {message && (
            <p
              role="status"
              className="rounded-sm border-2 border-forest bg-[#DDF1E2] p-3 text-sm text-forest"
            >
              {message}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm border-4 border-bark bg-forest px-5 py-4 font-display text-cream shadow-[4px_4px_0px_#725238] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none"
          >
            {loading
              ? 'Please wait...'
              : isSignup
                ? 'Create Account'
                : 'Enter Guildhaven'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
