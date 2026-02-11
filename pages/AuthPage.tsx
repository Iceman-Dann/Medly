import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  validatePassword, 
  validateEmail, 
  checkEmailExists,
  getCurrentUser 
} from '../lib/firebase';
import { judgeCharacter } from '../lib/judgeCharacter';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<any>(null);
  const [emailValidation, setEmailValidation] = useState<any>(null);
  const [judgeMessage, setJudgeMessage] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isJudgeSpeaking, setIsJudgeSpeaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [judgeReaction, setJudgeReaction] = useState<'normal' | 'happy' | 'angry' | 'surprised' | 'dizzy'>('normal');
  const [pokeCount, setPokeCount] = useState(0);
  const [isPoked, setIsPoked] = useState(false);
  const [showAccountNotFound, setShowAccountNotFound] = useState(false);
  const navigate = useNavigate();
  const animationRef = useRef<HTMLDivElement>(null);

  // Judge character animation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (animationRef.current) {
        const rect = animationRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });
        judgeCharacter.updateMousePosition(x, y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Initial judge greeting
  useEffect(() => {
    const message = judgeCharacter.getJudgeMessage(email || 'anonymous', 'greeting');
    setJudgeMessage(message);
    setIsJudgeSpeaking(true);
    const timer = setTimeout(() => setIsJudgeSpeaking(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Email validation
  useEffect(() => {
    if (email) {
      const validation = validateEmail(email);
      setEmailValidation(validation);
    }
  }, [email]);

  // Password validation
  useEffect(() => {
    if (password) {
      const validation = validatePassword(password);
      setPasswordValidation(validation);
      const message = judgeCharacter.getJudgeMessage(email || 'anonymous', 'password');
      setJudgeMessage(message);
      setIsJudgeSpeaking(true);
      const timer = setTimeout(() => setIsJudgeSpeaking(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [password]);

  const speakJudge = (context: 'greeting' | 'password' | 'success' | 'error' | 'google') => {
    const message = judgeCharacter.getJudgeMessage(email || 'anonymous', context);
    setJudgeMessage(message);
    setIsJudgeSpeaking(true);
    const timer = setTimeout(() => setIsJudgeSpeaking(false), 3000);
    return () => clearTimeout(timer);
  };

  // Interactive judge face reactions
  const handleJudgeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const reactions: Array<'happy' | 'angry' | 'surprised' | 'dizzy'> = ['happy', 'angry', 'surprised', 'dizzy'];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    setJudgeReaction(randomReaction);
    
    const messages = {
      happy: [
        "Hey! That tickles! 😄",
        "Stop it! That's my judging face! 🤣",
        "I'm supposed to be serious! But that was fun! 😊",
        "You found my tickle spot! No fair! 😂"
      ],
      angry: [
        "Hey! Watch it! I'm a respectable judge! 😠",
        "Don't poke the judge! That's assault! ⚖️",
        "I'll hold you in contempt! ...Just kidding! 😏",
        "One more poke and you're doing community service! 😤"
      ],
      surprised: [
        "Whoa! Didn't see that coming! 😮",
        "You startled me! I was judging! 🤯",
        "My wig almost fell off! Be careful! 😲",
        "In all my years of judging... nobody's done that! 😱"
      ],
      dizzy: [
          "Wheee! I'm dizzy! 🌀",
          "Stop spinning me! I need to judge! 😵",
          "The room is spinning! Or is it just me? 🤪",
          "I'm seeing stars! ⭐⭐⭐"
      ]
    };
    
    setJudgeMessage(messages[randomReaction][Math.floor(Math.random() * messages[randomReaction].length)]);
    setIsJudgeSpeaking(true);
    
    setTimeout(() => {
      setJudgeReaction('normal');
      setIsJudgeSpeaking(false);
    }, 2000);
  };

  const handleJudgePoke = (e: React.MouseEvent) => {
    e.preventDefault();
    setPokeCount(prev => prev + 1);
    setIsPoked(true);
    
    const pokeMessages = [
      `Ouch! That's poke #${pokeCount + 1}! Are you trying to break me? 🤕`,
      "Hey! I'm not a stress ball! 😤",
      "Poking the judge? Bold move! I like it! 😏",
      "Keep poking and I'll start charging! 💰",
      `${pokeCount + 1} pokes! You're obsessed with me! 😍`,
      "Is this your idea of foreplay? Weirdo! 😅",
      "I'm calling security! ...Just kidding! This is fun! 😄",
      "You poked me! I'm telling my mom! 👵"
    ];
    
    setJudgeMessage(pokeMessages[Math.floor(Math.random() * pokeMessages.length)]);
    setIsJudgeSpeaking(true);
    
    setTimeout(() => {
      setIsPoked(false);
      setIsJudgeSpeaking(false);
    }, 1500);
  };

  const getJudgeFaceExpression = () => {
    switch (judgeReaction) {
      case 'happy':
        return {
          mouth: 'w-16 h-8 border-t-4 border-black rounded-t-full',
          eyes: 'w-6 h-6 bg-black',
          eyebrows: 'rotate-12'
        };
      case 'angry':
        return {
          mouth: 'w-8 h-1 bg-black',
          eyes: 'w-10 h-10 bg-black',
          eyebrows: 'rotate-45'
        };
      case 'surprised':
        return {
          mouth: 'w-12 h-12 bg-black rounded-full',
          eyes: 'w-12 h-12 bg-black',
          eyebrows: '-rotate-45'
        };
      case 'dizzy':
        return {
          mouth: 'w-8 h-8 border-4 border-black rounded-full',
          eyes: 'w-8 h-8 bg-black',
          eyebrows: 'rotate-90'
        };
      default:
        return {
          mouth: isJudgeSpeaking ? 'w-16 h-8 border-b-4 border-black rounded-b-full animate-pulse' : 'w-12 h-2 bg-black rounded-full',
          eyes: 'w-8 h-8 bg-black',
          eyebrows: 'rotate-0'
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Login
        const userCredential = await signInWithEmail(email, password);
        judgeCharacter.updateMemory(email, { 
          loginSuccess: true, 
          passwordAttempts: 0 
        });
        judgeCharacter.addFunnyMoment(email, `Successful login on ${new Date().toLocaleDateString()}`);
        speakJudge('success');
        setSuccess('Perfect! You\'re in! 🎉');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // Signup - first check if email exists
        const emailCheck = await checkEmailExists(email);
        
        if (emailCheck.exists) {
          setError('Email already exists! Smart move checking first! 🎯 Try logging in instead!');
          speakJudge('error');
          setIsLoading(false);
          return;
        }

        // Validate password strength
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
          setError(passwordCheck.feedback.join(' '));
          speakJudge('error');
          setIsLoading(false);
          return;
        }

        // Create account
        const userCredential = await signUpWithEmail(email, password);
        judgeCharacter.updateMemory(email, { 
          loginSuccess: true, 
          passwordAttempts: 0 
        });
        judgeCharacter.addFunnyMoment(email, `Account created with password strength: ${passwordCheck.strength}`);
        speakJudge('success');
        setSuccess('Account created! Welcome to the club! 🎉');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      // Check if it's a "user not found" error
      if (err.code === 'auth/user-not-found' || err.message.includes('user not found') || err.message.includes('account not found')) {
        setShowAccountNotFound(true);
        setError('');
      } else {
        setError(err.message);
      }
      judgeCharacter.updateMemory(email, { 
        passwordAttempts: (judgeCharacter.getMemory(email).passwordAttempts || 0) + 1 
      });
      speakJudge('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithGoogle();
      judgeCharacter.updateMemory(userCredential.user.email!, { 
        loginSuccess: true, 
        passwordAttempts: 0 
      });
      judgeCharacter.addFunnyMoment(userCredential.user.email!, 'Used Google sign-in like a pro!');
      speakJudge('google');
      setSuccess('Google power! You\'re in! 🚀');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      speakJudge('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = () => {
    setIsLoading(true);
    setError('');
    
    // Create a fake anonymous user for testing
    const anonymousEmail = `anonymous${Date.now()}@test.com`;
    const fakeUser = {
      email: anonymousEmail,
      uid: `anon_${Date.now()}`,
      displayName: 'Anonymous Judge Tester'
    };
    
    judgeCharacter.updateMemory(anonymousEmail, { 
      loginSuccess: true, 
      passwordAttempts: 0 
    });
    judgeCharacter.addFunnyMoment(anonymousEmail, 'Used the secret anonymous entrance! 🕵️‍♂️');
    speakJudge('success');
    setSuccess('Anonymous mode activated! Using local storage only. 🎭');
    
    // Store the anonymous user in localStorage for session persistence
    localStorage.setItem('anonymous_user', JSON.stringify(fakeUser));
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
    
    setIsLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setPasswordValidation(null);
    setEmailValidation(null);
    speakJudge('greeting');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 flex">
      {/* Left Side - Judge Animation */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-600 to-rose-600">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h1 className="text-4xl font-bold mb-4">Medly Judge</h1>
            <p className="text-xl mb-8">Your personal authentication entertainer!</p>
            
            {/* Judge Character */}
            <div 
              ref={animationRef}
              className="relative w-64 h-64 mx-auto mb-8"
            >
              {/* Judge Face */}
              <div 
                className={`absolute inset-0 bg-yellow-300 rounded-full border-8 border-yellow-400 shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 ${
                  isPoked ? 'animate-bounce' : ''
                }`}
                style={{
                  transform: `translate(${(mousePos.x - 128) * 0.05}px, ${(mousePos.y - 128) * 0.05}px) scale(${1 + Math.sin(Date.now() * 0.001) * 0.02})`
                }}
                onClick={handleJudgeClick}
                onDoubleClick={handleJudgePoke}
                title="Click me! Double-click to poke!"
              >
                {/* Judge Wig/Hair - Now inside face container */}
                <div 
                  className={`w-48 h-16 bg-gray-800 rounded-t-full border-4 border-gray-900 mx-auto ${
                    judgeReaction === 'dizzy' ? 'animate-spin' : ''
                  }`}
                  style={{
                    marginTop: '-16px',
                    marginBottom: '-8px'
                  }}
                >
                  <div className="absolute top-2 left-4 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
                  <div className="absolute top-2 right-4 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
                  <div className="absolute top-4 left-12 w-3 h-3 bg-yellow-300 rounded-full animate-bounce" />
                  <div className="absolute top-4 right-12 w-3 h-3 bg-yellow-300 rounded-full animate-bounce" />
                </div>

                {/* Eyes */}
                <div className={`absolute top-16 left-16 ${getJudgeFaceExpression().eyes} rounded-full transition-all duration-200`}>
                  <div 
                    className="absolute w-4 h-4 bg-white rounded-full transition-all duration-100"
                    style={{
                      transform: `translate(${Math.max(-8, Math.min(8, (mousePos.x - 128) * 0.05))}px, ${Math.max(-8, Math.min(8, (mousePos.y - 128) * 0.05))}px)`,
                      left: judgeReaction === 'surprised' ? '12px' : '8px',
                      top: judgeReaction === 'surprised' ? '12px' : '8px'
                    }}
                  />
                </div>
                <div className={`absolute top-16 right-16 ${getJudgeFaceExpression().eyes} rounded-full transition-all duration-200`}>
                  <div 
                    className="absolute w-4 h-4 bg-white rounded-full transition-all duration-100"
                    style={{
                      transform: `translate(${Math.max(-8, Math.min(8, (mousePos.x - 128) * 0.05))}px, ${Math.max(-8, Math.min(8, (mousePos.y - 128) * 0.05))}px)`,
                      left: judgeReaction === 'surprised' ? '12px' : '8px',
                      top: judgeReaction === 'surprised' ? '12px' : '8px'
                    }}
                  />
                </div>
                
                {/* Mouth */}
                <div 
                  className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
                    getJudgeFaceExpression().mouth
                  }`}
                />
                
                {/* Eyebrows */}
                <div 
                  className="absolute top-12 left-16 w-12 h-2 bg-black rounded-full transform transition-all duration-300"
                  style={{
                    transform: `rotate(${-12 + (mousePos.y - 128) * 0.05}deg) translateY(${Math.sin(Date.now() * 0.002) * 2}px) ${getJudgeFaceExpression().eyebrows}`
                  }}
                />
                <div 
                  className="absolute top-12 right-16 w-12 h-2 bg-black rounded-full transform transition-all duration-300"
                  style={{
                    transform: `rotate(${12 - (mousePos.y - 128) * 0.05}deg) translateY(${Math.sin(Date.now() * 0.002) * 2}px) ${getJudgeFaceExpression().eyebrows}`
                  }}
                />
                
                {/* Gavel */}
                <div 
                  className="absolute bottom-0 right-0 w-16 h-8 bg-yellow-600 rounded-lg transform origin-left transition-all duration-300"
                  style={{
                    transform: `rotate(${45 + Math.sin(Date.now() * 0.001) * 15}deg) translateX(${Math.sin(Date.now() * 0.003) * 5}px)`
                  }}
                />
                
                {/* Funny Accessories */}
                <div 
                  className={`absolute top-8 left-1/2 transform -translate-x-1/2 text-2xl ${
                    judgeReaction === 'happy' ? 'animate-bounce' : 'animate-pulse'
                  }`}
                  style={{
                    animationDelay: '0.5s'
                  }}
                >
                  <div className={`w-8 h-8 rounded-full bg-yellow-400 border-2 border-yellow-600 ${
                    judgeReaction === 'happy' ? 'animate-pulse' : 
                    judgeReaction === 'angry' ? 'bg-red-400 border-red-600' :
                    judgeReaction === 'surprised' ? 'bg-blue-400 border-blue-600' :
                    judgeReaction === 'dizzy' ? 'bg-purple-400 border-purple-600' : ''
                  }`} />
                </div>
                
                {/* Interaction hint */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 animate-pulse">
                  Click me! 👆
                </div>
              </div>
              
              {/* Floating Decorations */}
              <div className="absolute -top-8 left-0 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="absolute -top-8 right-0 w-8 h-8 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              <div className="absolute -bottom-8 left-8 w-6 h-6 bg-yellow-300 rounded-full animate-pulse" style={{ animationDelay: '0.7s' }}></div>
              <div className="absolute -bottom-8 right-8 w-6 h-6 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
              
              {/* Poke counter */}
              {pokeCount > 0 && (
                <div className="absolute -top-12 right-0 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-bold animate-bounce">
                  Poked: {pokeCount} 👆
                </div>
              )}
            </div>

            {/* Judge Message */}
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 min-h-[80px] flex items-center justify-center">
              <p className="text-lg font-medium text-white">
                {judgeMessage || "Ready to judge your login skills! 😊"}
              </p>
            </div>

            {/* Achievement Badges */}
            {email && (
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {judgeCharacter.getAchievements(email).map((achievement, index) => (
                  <span key={index} className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                    {achievement}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="text-rose-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Medly</h1>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex bg-slate-100 dark:bg-rose-950/20 rounded-xl p-1 mb-8">
            <button
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                isLogin
                  ? 'bg-white dark:bg-rose-900/30 text-rose-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              onClick={toggleMode}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                !isLogin
                  ? 'bg-white dark:bg-rose-900/30 text-rose-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              onClick={toggleMode}
            >
              Sign Up
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-rose-900/30 rounded-xl bg-white dark:bg-surface-dark text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-surface-dark text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                  emailValidation 
                    ? emailValidation.isValid 
                      ? 'border-green-300' 
                      : 'border-red-300'
                    : 'border-slate-300 dark:border-rose-900/30'
                }`}
                placeholder="Enter your email"
                required
              />
              {emailValidation && (
                <p className={`mt-1 text-xs ${emailValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {emailValidation.feedback}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white dark:bg-surface-dark text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                    passwordValidation
                      ? passwordValidation.isValid
                        ? 'border-green-300'
                        : 'border-red-300'
                      : 'border-slate-300 dark:border-rose-900/30'
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              {passwordValidation && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-600">Strength:</span>
                    <span className={`text-xs font-bold ${
                      passwordValidation.strength === 'Strong' ? 'text-green-600' :
                      passwordValidation.strength === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {passwordValidation.strength}
                    </span>
                  </div>
                  {passwordValidation.feedback.map((feedback: string, index: number) => (
                    <p key={index} className="text-xs text-slate-500">
                      • {feedback}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-rose-500 hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (emailValidation && !emailValidation.isValid) || (passwordValidation && !passwordValidation.isValid)}
              className="w-full bg-rose-500 text-white py-3 px-4 rounded-xl font-bold hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Google Sign In */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-rose-900/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-surface-dark text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-surface-dark border border-slate-300 dark:border-rose-900/30 py-3 px-4 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-rose-950/20 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google (Cloud Storage)
              </button>

              {/* Anonymous Quick Sign-In */}
              <button
                onClick={handleAnonymousSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white py-3 px-4 rounded-xl font-bold hover:from-gray-900 hover:to-black transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                <span className="text-xl animate-pulse">�</span>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold">Incognito Mode</span>
                  <span className="text-xs opacity-75">Private • Local Storage</span>
                </div>
              </button>
            </div>
          </div>

          {/* Back to Landing */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors"
            >
              ← Back to landing page
            </Link>
          </div>
        </div>
      </div>

      {/* Account Not Found Popup */}
      {showAccountNotFound && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 max-w-md w-full shadow-2xl transform animate-pulse">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 animate-bounce">🤔</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Account Not Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Looks like you don't have an account yet! Want to create one?
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsLogin(false);
                  setShowAccountNotFound(false);
                  speakJudge('greeting');
                }}
                className="w-full bg-rose-500 text-white py-3 px-4 rounded-xl font-bold hover:bg-rose-600 transition-colors"
              >
                Create New Account
              </button>
              
              <button
                onClick={() => setShowAccountNotFound(false)}
                className="w-full bg-slate-100 dark:bg-rose-950/30 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-rose-950/50 transition-colors"
              >
                Try Different Email
              </button>
              
              <button
                onClick={() => {
                  setShowAccountNotFound(false);
                  handleAnonymousSignIn();
                }}
                className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white py-3 px-4 rounded-xl font-bold hover:from-gray-900 hover:to-black transition-all duration-300"
              >
                � Use Incognito Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
