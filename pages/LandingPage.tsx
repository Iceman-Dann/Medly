import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useHealth } from '../HealthContext';

const SymraLanding = () => {
  const { logs, addLog } = useHealth();
  const [expandedCapability, setExpandedCapability] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showTimelinePoint, setShowTimelinePoint] = useState(false);
  const [currentFlowStep, setCurrentFlowStep] = useState(0);
  const heroRef = useRef(null);

  // Sample data for landing page demo - combine real logs with sample if empty
  const sampleLogs = [
    {
      id: 'sample-1',
      timestamp: Date.now() - 86400000, // 1 day ago
      name: 'Headache, Fatigue, Stress',
      category: 'Headache' as any,
      intensity: 7,
      notes: 'Persistent frontal headache for 3 days. Worsens in mornings. Accompanied by fatigue and stress-related symptoms. Taking over-the-counter pain relievers with limited effectiveness.',
      triggers: ['Stress', 'lack of sleep', 'screen time'],
      cyclePhase: 'Do Not Disclose'
    },
    {
      id: 'sample-2', 
      timestamp: Date.now() - 172800000, // 2 days ago
      name: 'Nausea, Bloating',
      category: 'Nausea' as any,
      intensity: 5,
      notes: 'Mild nausea and abdominal bloating after meals. Started 2 days ago. No fever or vomiting. Appetite slightly decreased.',
      triggers: ['Large meals', 'spicy food'],
      cyclePhase: 'Do Not Disclose'
    },
    {
      id: 'sample-3',
      timestamp: Date.now() - 259200000, // 3 days ago  
      name: 'Lower Back Pain',
      category: 'Back Pain' as any,
      intensity: 6,
      notes: 'Dull lower back pain, worse when sitting for extended periods. Some relief with stretching and heat application.',
      triggers: ['Prolonged sitting', 'heavy lifting'],
      cyclePhase: 'Do Not Disclose'
    }
  ];

  // Use real logs if available, otherwise show sample data
  const displayLogs = logs.length > 0 ? logs : sampleLogs;

  const capabilities = [
    {
      id: 'logging',
      title: 'Symptom & Event Logging',
      description: 'Structured health tracking with temporal context',
      hint: 'Auto-structured',
      details: [
        'Timestamped, structured entries',
        'Context-aware notes',
        'Multi-symptom correlation'
      ]
    },
    {
      id: 'timelines',
      title: 'Health Timelines & Trends',
      description: 'Longitudinal pattern recognition',
      hint: 'Longitudinal insight',
      details: [
        'Pattern recognition across time',
        'Visual correlation of events',
        'Temporal health mapping'
      ]
    },
    {
      id: 'soap',
      title: 'Clinical SOAP Notes',
      description: 'Professional medical documentation format',
      hint: 'Doctor-ready format',
      details: [
        'Subjective / Objective / Assessment / Plan format',
        'Doctor-ready PDFs',
        'Structured clinical summaries'
      ]
    },
    {
      id: 'preparation',
      title: 'Doctor Preparation Workspace',
      description: 'Focused appointment planning',
      hint: 'Visit-focused',
      details: [
        'Agenda building',
        'Focused questions',
        'Summary snapshots'
      ]
    },
    {
      id: 'sharing',
      title: 'Secure Sharing',
      description: 'User-controlled data export',
      hint: 'Encrypted export',
      details: [
        'QR-code handshake',
        'No background syncing',
        'User-controlled access'
      ]
    }
  ];

  const systemLayers = [
    { name: 'Data Layer', description: 'Structured symptom and event logging', icon: 'database' },
    { name: 'Timeline Layer', description: 'Longitudinal health context', icon: 'analytics' },
    { name: 'Clinical Layer', description: 'SOAP note synthesis', icon: 'clipboard' },
    { name: 'Preparation Layer', description: 'Questions and visit focus', icon: 'document' },
    { name: 'Sharing Layer', description: 'QR-based, user-initiated export', icon: 'upload' }
  ];

  const dataFlowSteps = [
    { id: 0, label: 'Symptom' },
    { id: 1, label: 'Timeline' },
    { id: 2, label: 'SOAP' },
    { id: 3, label: 'QR' },
    { id: 4, label: 'Share' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePosition({ x, y });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.scroll-animate').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFlowStep(prev => (prev + 1) % 5);
    }, 3000); // Smooth 3-second intervals
    return () => clearInterval(interval);
  }, []);

  const handleAddSymptom = async () => {
    setShowTimelinePoint(true);
    
    // Add to real backend for persistence
    try {
      await addLog({
        name: 'Headache, Eye Strain',
        category: 'Headache' as any,
        intensity: 6,
        notes: 'New headache with eye strain symptoms. Started after extended screen time. Mild to moderate intensity, throbbing sensation behind eyes.',
        triggers: ['Screen time', 'eye strain', 'dehydration'],
        cyclePhase: 'Do Not Disclose'
      });
    } catch (error) {
      console.error('Failed to add demo symptom:', error);
    }
    
    setTimeout(() => setShowTimelinePoint(false), 3000);
  };

  const toggleCapability = (id) => {
    setExpandedCapability(expandedCapability === id ? null : id);
  };

  const tiltStyle = {
    transform: `perspective(1200px) rotateX(${mousePosition.y * -3}deg) rotateY(${mousePosition.x * 3}deg) translateZ(20px)`
  };

  return (
    <div className="symra-landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:wght@300;600;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --rose-500: #d97b8c;
          --rose-400: #e49aa7;
          --rose-200: #fce7e9;
          --rose-700: #b05a69;
          --rose-800: #8e5a65;
          --bg-warm: #fdfaf7;
          --text-900: #1a1415;
          --muted-rose: #5a4145;
          --rose-gray: #8e6d73;
          --bg-dark: #0a0708;
          --surface-dark: #1a1214;
          --surface-dark-elevated: #2a1f21;
          --text-dark: #fdf6f6;
          --ease: cubic-bezier(.16,.84,.24,1);
          --ease-spring: cubic-bezier(.34,1.56,.64,1);
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg-warm);
          color: var(--text-900);
          line-height: 1.6;
          transition: background 600ms var(--ease), color 600ms var(--ease);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body.dark {
          background: var(--bg-dark);
          color: var(--text-dark);
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Advanced Keyframe Animations */
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }

        @keyframes floatFast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes morphBlob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes shimmerSweep {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }

        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(217, 123, 140, 0.3), 0 0 40px rgba(217, 123, 140, 0.1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(217, 123, 140, 0.5), 0 0 60px rgba(217, 123, 140, 0.2);
          }
        }

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-5deg);
          }
          60% {
            transform: scale(1.05) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes flowPulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes iconSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Scroll animations */
        .scroll-animate {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 600ms var(--ease), transform 600ms var(--ease);
        }

        .scroll-animate.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .stagger-1 { transition-delay: 100ms; }
        .stagger-2 { transition-delay: 200ms; }
        .stagger-3 { transition-delay: 300ms; }
        .stagger-4 { transition-delay: 400ms; }
        .stagger-5 { transition-delay: 500ms; }

        /* Header */
        header {
          padding: 1.75rem 0;
          border-bottom: 1px solid rgba(217, 123, 140, 0.1);
          background: rgba(253, 250, 247, 0.8);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          position: sticky;
          top: 0;
          z-index: 100;
          transition: all 400ms var(--ease);
        }

        body.dark header {
          background: rgba(10, 7, 8, 0.8);
          border-bottom-color: rgba(217, 123, 140, 0.2);
        }

        header.scrolled {
          padding: 1.25rem 0;
          box-shadow: 0 8px 32px rgba(217, 123, 140, 0.08);
        }

        body.dark header.scrolled {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
        }

        .logo {
          font-family: 'Fraunces', serif;
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--rose-500), var(--rose-700));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.03em;
          position: relative;
        }

        .logo::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 40px;
          height: 3px;
          background: var(--rose-500);
          border-radius: 2px;
        }

        nav {
          display: flex;
          gap: 2.5rem;
          align-items: center;
        }

        nav a {
          color: var(--rose-gray);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: color 250ms var(--ease);
          position: relative;
        }

        nav a::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          width: 0;
          height: 2px;
          background: var(--rose-500);
          transition: width 250ms var(--ease), left 250ms var(--ease);
        }

        nav a:hover::after,
        nav a:focus::after {
          width: 100%;
          left: 0;
        }

        nav a:hover,
        nav a:focus {
          color: var(--rose-500);
          outline: none;
        }

        body.dark nav a {
          color: var(--text-dark);
          opacity: 0.8;
        }

        body.dark nav a:hover,
        body.dark nav a:focus {
          color: var(--rose-500);
          opacity: 1;
        }

        .btn {
          padding: 0.9rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 200ms var(--ease);
          display: inline-block;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 600ms var(--ease), height 600ms var(--ease);
        }

        .btn:hover::before {
          width: 300px;
          height: 300px;
        }

        .btn:focus-visible {
          outline: 2px solid var(--rose-500);
          outline-offset: 3px;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--rose-500), var(--rose-700));
          color: white;
          box-shadow: 0 4px 16px rgba(217, 123, 140, 0.3);
        }

        .btn-primary:hover,
        .btn-primary:focus {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(217, 123, 140, 0.5);
        }

        .btn-primary:active {
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: transparent;
          border: 2px solid var(--rose-500);
          color: var(--rose-500);
        }

        .btn-secondary:hover,
        .btn-secondary:focus {
          background: var(--rose-200);
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(217, 123, 140, 0.2);
        }

        body.dark .btn-secondary:hover,
        body.dark .btn-secondary:focus {
          background: var(--muted-rose);
        }

        /* Hero */
        .hero {
          position: relative;
          padding: 8rem 0 6rem;
          overflow: hidden;
          background: linear-gradient(135deg, 
            rgba(252, 231, 233, 0.5) 0%, 
            rgba(253, 250, 247, 0.3) 50%,
            rgba(252, 231, 233, 0.5) 100%
          );
          background-size: 200% 200%;
          animation: gradientShift 15s ease infinite;
        }

        body.dark .hero {
          background: linear-gradient(135deg, 
            rgba(90, 65, 69, 0.2) 0%, 
            rgba(10, 7, 8, 0.5) 50%,
            rgba(90, 65, 69, 0.2) 100%
          );
          background-size: 200% 200%;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -30%;
          width: 100%;
          height: 200%;
          background: radial-gradient(circle at center, rgba(217, 123, 140, 0.15) 0%, transparent 70%);
          animation: floatSlow 20s ease-in-out infinite;
          pointer-events: none;
        }

        .hero::after {
          content: '';
          position: absolute;
          bottom: -50%;
          left: -30%;
          width: 80%;
          height: 150%;
          background: radial-gradient(circle at center, rgba(217, 123, 140, 0.1) 0%, transparent 60%);
          animation: floatSlow 25s ease-in-out infinite reverse;
          pointer-events: none;
        }

        .hero-container {
          position: relative;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 4rem;
          align-items: center;
          z-index: 1;
        }

        .hero-content {
          position: relative;
        }

        .hero h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(2.75rem, 6vw, 5rem);
          font-weight: 800;
          margin-bottom: 2rem;
          line-height: 1.08;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, var(--text-900) 0%, var(--rose-700) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        body.dark .hero h1 {
          background: linear-gradient(135deg, var(--text-dark) 0%, var(--rose-400) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero .subtitle {
          font-size: clamp(1.15rem, 2.2vw, 1.45rem);
          margin-bottom: 3rem;
          opacity: 0.88;
          font-weight: 400;
          line-height: 1.75;
          max-width: 600px;
        }

        .trust-badges {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          border: 1px solid rgba(217, 123, 140, 0.15);
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 300ms var(--ease-spring);
          position: relative;
          overflow: hidden;
        }

        .trust-badge::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(217, 123, 140, 0.1), transparent);
          transform: translateX(-100%) rotate(45deg);
          transition: transform 600ms var(--ease);
        }

        .trust-badge:hover::before {
          transform: translateX(100%) rotate(45deg);
        }

        .trust-badge:hover {
          background: white;
          border-color: var(--rose-500);
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 8px 24px rgba(217, 123, 140, 0.25);
        }

        body.dark .trust-badge {
          background: rgba(26, 18, 20, 0.9);
          border-color: rgba(217, 123, 140, 0.25);
        }

        body.dark .trust-badge:hover {
          background: var(--surface-dark-elevated);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .badge-icon {
          flex-shrink: 0;
        }

        .hero-ctas {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
        }

        .trust-line {
          font-size: 0.9rem;
          opacity: 0.65;
          color: var(--rose-gray);
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        body.dark .trust-line {
          color: var(--text-dark);
        }

        /* Live SOAP Preview with 3D effect */
        .hero-mock-container {
          perspective: 1500px;
          position: relative;
        }

        .hero-mock {
          background: white;
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 
            0 30px 90px rgba(217, 123, 140, 0.3),
            0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(217, 123, 140, 0.2);
          animation: floatFast 4s ease-in-out infinite;
          transition: transform 150ms ease-out;
          position: relative;
          overflow: hidden;
        }

        .hero-mock::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(217, 123, 140, 0.1), 
            transparent
          );
          animation: shimmerSweep 3s ease-in-out infinite;
        }

        body.dark .hero-mock {
          background: var(--surface-dark);
          border-color: rgba(217, 123, 140, 0.3);
          box-shadow: 
            0 30px 90px rgba(0, 0, 0, 0.6),
            0 10px 30px rgba(217, 123, 140, 0.2);
        }

        .mock-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.25rem;
          border-bottom: 2px solid rgba(217, 123, 140, 0.15);
        }

        .mock-icon {
          flex-shrink: 0;
        }

        .mock-header h4 {
          font-family: 'Fraunces', serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-900);
        }

        body.dark .mock-header h4 {
          color: var(--text-dark);
        }

        .soap-line {
          font-size: 0.95rem;
          padding: 0.75rem 0;
          color: var(--rose-gray);
          opacity: 0;
          animation: slideInFromLeft 500ms var(--ease) forwards;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
          line-height: 1.7;
        }

        body.dark .soap-line {
          color: var(--text-dark);
          opacity: 0.85;
        }

        .soap-line.active {
          opacity: 1;
        }

        .soap-line strong {
          color: var(--rose-500);
          font-weight: 700;
          margin-right: 0.75rem;
          font-size: 1.05rem;
        }

        .typing-cursor {
          display: inline-block;
          width: 2px;
          height: 18px;
          background: var(--rose-500);
          margin-left: 4px;
          animation: blink 1s step-end infinite;
        }

        /* Data Flow with animated SVG */
        .data-flow-section {
          padding: 6rem 0;
          position: relative;
          background: var(--bg-warm);
        }

        body.dark .data-flow-section {
          background: var(--bg-dark);
        }

        .flow-diagram {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0;
          margin-top: 4rem;
          position: relative;
        }

        .flow-connector {
          flex: 1;
          height: 2px;
          background: linear-gradient(to right, 
            rgba(217, 123, 140, 0.3), 
            rgba(217, 123, 140, 0.6),
            rgba(217, 123, 140, 0.3)
          );
          position: relative;
        }

        .flow-connector::after {
          content: '→';
          position: absolute;
          right: -10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--rose-500);
          font-size: 1.5rem;
          opacity: 0.5;
        }

        .flow-step {
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .flow-icon-container {
          width: 100px;
          height: 100px;
          margin: 0 auto 1.25rem;
          background: white;
          border: 3px solid rgba(217, 123, 140, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 400ms var(--ease-spring);
          position: relative;
          overflow: hidden;
        }

        .flow-icon-container::before {
          content: '';
          position: absolute;
          inset: -50%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            var(--rose-500) 90deg,
            transparent 180deg
          );
          animation: iconSpin 3s linear infinite;
          opacity: 0;
          transition: opacity 400ms var(--ease);
        }

        body.dark .flow-icon-container {
          background: var(--surface-dark);
          border-color: rgba(217, 123, 140, 0.3);
        }

        .flow-step.active .flow-icon-container {
          background: linear-gradient(135deg, var(--rose-500), var(--rose-700));
          border-color: var(--rose-500);
          box-shadow: 0 0 40px rgba(217, 123, 140, 0.7);
          transform: scale(1.15);
          transition: all 600ms var(--ease-spring);
        }

        .flow-step.active .flow-icon-container::before {
          opacity: 0.3;
          transition: opacity 600ms var(--ease);
        }

        .flow-icon {
          transition: all 600ms var(--ease-spring);
        }

        .flow-step.active .flow-icon {
          animation: none;
        }

        .flow-label {
          font-size: 1rem;
          font-weight: 600;
          color: var(--rose-gray);
          transition: all 600ms var(--ease-spring);
        }

        .flow-step.active .flow-label {
          color: var(--rose-500);
          transform: scale(1.1);
          transition: all 600ms var(--ease-spring);
        }

        body.dark .flow-label {
          color: var(--text-dark);
          opacity: 0.7;
        }

        body.dark .flow-step.active .flow-label {
          color: var(--rose-500);
          opacity: 1;
        }

        /* Interactive Timeline */
        .timeline-demo {
          background: white;
          border: 2px solid rgba(217, 123, 140, 0.2);
          border-radius: 20px;
          padding: 3rem;
          margin-top: 3.5rem;
          position: relative;
          overflow: hidden;
        }

        .timeline-demo::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 200%;
          background: radial-gradient(circle, rgba(217, 123, 140, 0.05) 0%, transparent 70%);
          animation: floatSlow 15s ease-in-out infinite;
        }

        body.dark .timeline-demo {
          background: var(--surface-dark);
          border-color: rgba(217, 123, 140, 0.3);
        }

        .demo-actions {
          display: flex;
          gap: 2rem;
          align-items: center;
          margin-bottom: 2.5rem;
          position: relative;
          z-index: 1;
        }

        .demo-hint {
          font-size: 0.95rem;
          color: var(--rose-gray);
          font-weight: 500;
        }

        .interactive-timeline {
          position: relative;
          background: rgba(217, 123, 140, 0.03);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(217, 123, 140, 0.1);
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .timeline-header h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-900);
        }

        body.dark .timeline-header h4 {
          color: var(--text-dark);
        }

        .timeline-stats {
          font-size: 0.9rem;
          color: var(--rose-gray);
          font-weight: 500;
        }

        .timeline-events {
          position: relative;
          height: 200px;
          background: linear-gradient(to bottom, 
            rgba(217, 123, 140, 0.05), 
            rgba(217, 123, 140, 0.02)
          );
          border-radius: 12px;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .timeline-event {
          position: absolute;
          transform: translate(-50%, -50%);
          transition: all 300ms var(--ease);
        }

        .timeline-event:hover {
          transform: translate(-50%, -50%) scale(1.2);
        }

        .event-dot {
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.8);
          transition: all 300ms var(--ease);
          cursor: pointer;
        }

        body.dark .event-dot {
          box-shadow: 0 0 0 4px rgba(10, 7, 8, 0.8);
        }

        .event-dot:hover {
          box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.9);
        }

        body.dark .event-dot:hover {
          box-shadow: 0 0 0 8px rgba(10, 7, 8, 0.9);
        }

        .event-label {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
          background: white;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(217, 123, 140, 0.2);
          font-size: 0.75rem;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 300ms var(--ease);
          pointer-events: none;
        }

        body.dark .event-label {
          background: var(--surface-dark);
          border-color: rgba(217, 123, 140, 0.3);
        }

        .timeline-event:hover .event-label {
          opacity: 1;
        }

        .event-name {
          font-weight: 600;
          color: var(--text-900);
        }

            body.dark .event-name {
              color: var(--text-dark);
            }

            .event-intensity {
              font-size: 0.7rem;
              color: var(--rose-gray);
            }

            .event-time {
              font-size: 0.65rem;
              color: var(--rose-gray);
              opacity: 0.8;
            }

            .empty-timeline {
              height: 200px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: var(--rose-gray);
              font-style: italic;
              text-align: center;
            }

            .empty-icon {
              font-size: 3rem;
              margin-bottom: 1rem;
              opacity: 0.5;
            }

            .timeline-legend {
              display: flex;
              justify-content: center;
              gap: 2rem;
              padding: 1rem;
              background: rgba(217, 123, 140, 0.02);
              border-radius: 8px;
            }

            .legend-item {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.85rem;
              color: var(--rose-gray);
            }

            .legend-dot {
              width: 12px;
              height: 12px;
              border-radius: 50%;
            }

            .legend-dot.low {
              background: #10b981;
            }

            .legend-dot.medium {
              background: #f59e0b;
            }
          position: relative;
        }

        .section-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(2.25rem, 5vw, 3.5rem);
          font-weight: 800;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, var(--rose-700), var(--rose-500));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        body.dark .section-title {
          background: linear-gradient(135deg, var(--rose-500), var(--rose-400));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-subtitle {
          font-size: 1.2rem;
          color: var(--rose-gray);
          margin-bottom: 3.5rem;
          max-width: 700px;
          line-height: 1.8;
          font-weight: 400;
        }

        body.dark .section-subtitle {
          color: var(--text-dark);
          opacity: 0.8;
        }

        /* System Layers with enhanced styling */
        .system-layers {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-top: 3rem;
          position: relative;
        }

        .layer-card {
          background: white;
          border: 1px solid rgba(217, 123, 140, 0.12);
          border-radius: 16px;
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          transition: all 350ms var(--ease-spring);
          position: relative;
          overflow: hidden;
        }

        .layer-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(to bottom, var(--rose-500), var(--rose-700));
          transform: scaleY(0);
          transition: transform 350ms var(--ease);
        }

        .layer-card:hover::before {
          transform: scaleY(1);
        }

        .layer-card:hover {
          border-color: var(--rose-500);
          transform: translateX(12px);
          box-shadow: 0 12px 40px rgba(217, 123, 140, 0.25);
        }

        body.dark .layer-card {
          background: var(--surface-dark);
          border-color: rgba(217, 123, 140, 0.2);
        }

        body.dark .layer-card:hover {
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .layer-icon-container {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(217, 123, 140, 0.1), rgba(217, 123, 140, 0.05));
          border-radius: 12px;
          transition: all 300ms var(--ease);
        }

        .layer-card:hover .layer-icon-container {
          background: linear-gradient(135deg, var(--rose-500), var(--rose-700));
          transform: rotate(5deg) scale(1.1);
        }

        .layer-content h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.6rem;
          color: var(--text-900);
        }

        body.dark .layer-content h3 {
          color: var(--text-dark);
        }

        .layer-content p {
          font-size: 1rem;
          color: var(--rose-gray);
          line-height: 1.7;
        }

        body.dark .layer-content p {
          color: var(--text-dark);
          opacity: 0.75;
        }

        .caption {
          text-align: center;
          margin-top: 3.5rem;
          font-size: 1.05rem;
          color: var(--rose-gray);
          font-style: italic;
          font-weight: 500;
        }

        body.dark .caption {
          color: var(--text-dark);
          opacity: 0.65;
        }

        /* Capabilities */
        .capabilities-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-top: 3rem;
        }

        .capability-card {
          background: white;
          border: 1px solid rgba(217, 123, 140, 0.12);
          border-radius: 16px;
          overflow: hidden;
          transition: all 300ms var(--ease);
        }

        body.dark .capability-card {
          background: var(--surface-dark);
          border-color: rgba(217, 123, 140, 0.2);
        }

        .capability-card:hover {
          border-color: var(--rose-500);
          box-shadow: 0 8px 32px rgba(217, 123, 140, 0.2);
        }

        .capability-header {
          padding: 2rem;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 250ms var(--ease);
        }

        .capability-header:hover,
        .capability-header:focus {
          background: rgba(217, 123, 140, 0.05);
        }

        body.dark .capability-header:hover,
        body.dark .capability-header:focus {
          background: rgba(217, 123, 140, 0.08);
        }

        .capability-info h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.6rem;
          color: var(--text-900);
        }

        body.dark .capability-info h3 {
          color: var(--text-dark);
        }

        .capability-hint {
          display: inline-block;
          font-size: 0.7rem;
          padding: 0.35rem 0.8rem;
          background: linear-gradient(135deg, var(--rose-200), var(--rose-400));
          color: var(--rose-800);
          border-radius: 8px;
          margin-left: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        body.dark .capability-hint {
          background: linear-gradient(135deg, var(--muted-rose), var(--rose-700));
          color: var(--rose-200);
        }

        .capability-info p {
          font-size: 1rem;
          color: var(--rose-gray);
          line-height: 1.7;
        }

        body.dark .capability-info p {
          color: var(--text-dark);
          opacity: 0.75;
        }

        .expand-icon {
          font-size: 1.5rem;
          transition: transform 300ms var(--ease);
          flex-shrink: 0;
          color: var(--rose-500);
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .capability-details {
          max-height: 0;
          overflow: hidden;
          transition: max-height 400ms var(--ease);
        }

        .capability-details.expanded {
          max-height: 600px;
        }

        .capability-details-content {
          padding: 0 2rem 2rem;
          border-top: 1px solid rgba(217, 123, 140, 0.1);
        }

        body.dark .capability-details-content {
          border-top-color: rgba(217, 123, 140, 0.2);
        }

        .capability-details ul {
          list-style: none;
          margin-top: 1.25rem;
        }

        .capability-details li {
          padding: 0.75rem 0;
          padding-left: 2rem;
          position: relative;
          color: var(--rose-gray);
          font-size: 0.98rem;
        }

        body.dark .capability-details li {
          color: var(--text-dark);
          opacity: 0.85;
        }

        .capability-details li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--rose-500);
          font-weight: 700;
          font-size: 1.1rem;
        }

        /* Privacy Section */
        .privacy-visual {
          background: white;
          border: 3px solid var(--rose-500);
          border-radius: 20px;
          padding: 4rem;
          margin: 3rem 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .privacy-visual::before {
          content: '';
          position: absolute;
          inset: -100%;
          background: conic-gradient(
            from 0deg,
            transparent,
            rgba(217, 123, 140, 0.1),
            transparent
          );
          animation: iconSpin 20s linear infinite;
        }

        body.dark .privacy-visual {
          background: var(--surface-dark);
        }

        .privacy-visual-content {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 3rem;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        .privacy-list {
          list-style: none;
          margin-top: 3.5rem;
          position: relative;
          z-index: 1;
        }

        .privacy-list li {
          padding: 1.1rem 0;
          padding-left: 3rem;
          position: relative;
          font-size: 1.15rem;
          font-weight: 500;
        }

        .privacy-list li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--rose-500);
          font-weight: 700;
          font-size: 1.75rem;
        }

        /* Disclaimer */
        .disclaimer-box {
          background: linear-gradient(135deg, rgba(252, 231, 233, 0.5), rgba(252, 231, 233, 0.8));
          border-left: 6px solid var(--rose-500);
          padding: 2.5rem;
          border-radius: 16px;
          margin-top: 3rem;
        }

        body.dark .disclaimer-box {
          background: linear-gradient(135deg, rgba(90, 65, 69, 0.3), rgba(90, 65, 69, 0.5));
        }

        .disclaimer-box ul {
          list-style: none;
          margin-top: 1.5rem;
        }

        .disclaimer-box li {
          padding: 0.75rem 0;
          padding-left: 2.5rem;
          position: relative;
          font-size: 1.05rem;
        }

        .disclaimer-box li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--rose-700);
          font-size: 1.75rem;
        }

        body.dark .disclaimer-box li::before {
          color: var(--rose-500);
        }

        /* Preview Cards */
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2.5rem;
          margin-top: 3.5rem;
        }

        .preview-card {
          background: white;
          border: 1px solid rgba(217, 123, 140, 0.12);
          border-radius: 20px;
          padding: 3rem 2.5rem;
          transition: all 350ms var(--ease-spring);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .preview-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(217, 123, 140, 0.05), transparent);
          transform: translateX(-100%);
          transition: transform 600ms var(--ease);
        }

        .preview-card:hover::before {
          transform: translateX(100%);
        }

        .preview-card:hover,
        .preview-card:focus {
          border-color: var(--rose-500);
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 20px 60px rgba(217, 123, 140, 0.3);
        }

        body.dark .preview-card {
          background: var(--surface-dark);
          border-color: rgba(217, 123, 140, 0.2);
        }

        body.dark .preview-card:hover,
        body.dark .preview-card:focus {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .preview-icon-container {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(217, 123, 140, 0.1), rgba(217, 123, 140, 0.05));
          border-radius: 16px;
          margin-bottom: 1.75rem;
          transition: all 300ms var(--ease);
        }

        .preview-card:hover .preview-icon-container {
          background: linear-gradient(135deg, var(--rose-500), var(--rose-700));
          transform: scale(1.1) rotate(5deg);
        }

        .preview-card h3 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--text-900);
        }

        body.dark .preview-card h3 {
          color: var(--text-dark);
        }

        .preview-card p {
          font-size: 1rem;
          color: var(--rose-gray);
          line-height: 1.8;
        }

        body.dark .preview-card p {
          color: var(--text-dark);
          opacity: 0.8;
        }

        /* Tech List */
        .tech-list {
          list-style: none;
          margin-top: 3rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .tech-list li {
          padding: 2rem;
          background: white;
          border: 1px solid rgba(217, 123, 140, 0.12);
          border-radius: 16px;
          transition: all 300ms var(--ease);
          font-size: 1.05rem;
          color: var(--text-900);
          font-weight: 500;
          position: relative;
          overflow: hidden;
        }

        .tech-list li::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(to right, var(--rose-500), var(--rose-700));
          transform: scaleX(0);
          transition: transform 300ms var(--ease);
        }

        .tech-list li:hover::before {
          transform: scaleX(1);
        }

        .tech-list li:hover,
        .tech-list li:focus {
          border-color: var(--rose-500);
          transform: translateY(-8px);
          box-shadow: 0 12px 36px rgba(217, 123, 140, 0.25);
        }

        body.dark .tech-list li {
          background: var(--surface-dark);
          border-color: rgba(217, 123, 140, 0.2);
          color: var(--text-dark);
        }

        body.dark .tech-list li:hover,
        body.dark .tech-list li:focus {
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
        }

        /* Final CTA */
        .final-cta {
          background: linear-gradient(135deg, 
            rgba(252, 231, 233, 0.6) 0%, 
            rgba(253, 250, 247, 0.3) 50%,
            rgba(252, 231, 233, 0.6) 100%
          );
          background-size: 200% 200%;
          animation: gradientShift 10s ease infinite;
          text-align: center;
          padding: 7rem 0;
          border-top: 1px solid rgba(217, 123, 140, 0.15);
          position: relative;
          overflow: hidden;
        }

        .final-cta::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(217, 123, 140, 0.1) 0%, transparent 70%);
          animation: floatSlow 20s ease-in-out infinite;
        }

        body.dark .final-cta {
          background: linear-gradient(135deg, 
            rgba(90, 65, 69, 0.3) 0%, 
            rgba(10, 7, 8, 0.5) 50%,
            rgba(90, 65, 69, 0.3) 100%
          );
          background-size: 200% 200%;
          border-top-color: rgba(217, 123, 140, 0.25);
        }

        .final-cta h2 {
          font-family: 'Fraunces', serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          margin-bottom: 3rem;
          background: linear-gradient(135deg, var(--text-900), var(--rose-700));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
          z-index: 1;
        }

        body.dark .final-cta h2 {
          background: linear-gradient(135deg, var(--text-dark), var(--rose-400));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .final-cta-buttons {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        /* Footer */
        footer {
          background: linear-gradient(135deg, var(--rose-700), var(--rose-800));
          color: white;
          text-align: center;
          padding: 3.5rem 0;
          font-size: 0.95rem;
        }

        body.dark footer {
          background: linear-gradient(135deg, var(--text-900), var(--surface-dark));
        }

        footer p {
          opacity: 0.95;
          font-weight: 500;
        }

        /* Theme Toggle */
        .theme-toggle {
          position: fixed;
          bottom: 2.5rem;
          right: 2.5rem;
          background: linear-gradient(135deg, var(--rose-500), var(--rose-700));
          color: white;
          border: none;
          border-radius: 50%;
          width: 68px;
          height: 68px;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(217, 123, 140, 0.4);
          transition: all 250ms var(--ease-spring);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
        }

        .theme-toggle:hover,
        .theme-toggle:focus {
          transform: scale(1.2) rotate(10deg);
          box-shadow: 0 12px 48px rgba(217, 123, 140, 0.6);
        }

        .theme-toggle:active {
          transform: scale(0.95);
        }

        .theme-toggle:focus-visible {
          outline: 3px solid var(--rose-500);
          outline-offset: 6px;
        }

        body.dark .theme-toggle {
          background: linear-gradient(135deg, var(--surface-dark-elevated), var(--muted-rose));
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 4rem;
          }

          .flow-diagram {
            flex-wrap: wrap;
            gap: 2rem;
            justify-content: center;
          }

          .flow-connector {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .hero {
            padding: 6rem 0 4rem;
          }

          .hero h1 {
            font-size: 2.5rem;
          }

          .section-title {
            font-size: 2rem;
          }

          nav {
            display: none;
          }

          .trust-badges {
            grid-template-columns: 1fr;
          }

          .layer-card {
            flex-direction: column;
            text-align: center;
          }

          .preview-grid {
            grid-template-columns: 1fr;
          }

          .tech-list {
            grid-template-columns: 1fr;
          }

          .theme-toggle {
            width: 56px;
            height: 56px;
            bottom: 1.5rem;
            right: 1.5rem;
          }

          .container {
            padding: 0 1.5rem;
          }
        }
      `}</style>

      {/* SVG Definitions */}
      <svg style={{ display: 'none' }}>
        <defs>
          <symbol id="icon-lock" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 1a5 5 0 0 0-5 5v4H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V12a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v4H9V6a3 3 0 0 1 3-3z"/>
          </symbol>
          <symbol id="icon-shield" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.11v5.71c0 4.83-3.13 9.37-7 10.82-3.87-1.45-7-5.99-7-10.82V6.29l7-3.11zM11 7v2h2V7h-2zm0 4v6h2v-6h-2z"/>
          </symbol>
          <symbol id="icon-no-cloud" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM3.28 2.22L2.22 3.28 5.97 7.03A5.983 5.983 0 0 0 6 14h.17l2.1 2.1c-.09-.03-.17-.1-.27-.1h-2c-2.21 0-4-1.79-4-4s1.79-4 4-4h.14l.14-.43A5.495 5.495 0 0 1 11.73 4l2 2h.01l6.98 6.98 1.06-1.06-18.5-18.5z"/>
          </symbol>
          <symbol id="icon-user-check" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </symbol>
          <symbol id="icon-document" viewBox="0 0 24 24">
            <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z"/>
          </symbol>
          <symbol id="icon-timeline" viewBox="0 0 24 24">
            <path fill="currentColor" d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"/>
          </symbol>
          <symbol id="icon-qr" viewBox="0 0 24 24">
            <path fill="currentColor" d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 0h2v2h-2v-2zm0-4h2v2h-2v-2zm2-2h2v2h-2v-2z"/>
          </symbol>
          <symbol id="icon-share" viewBox="0 0 24 24">
            <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </symbol>
          <symbol id="icon-healing" viewBox="0 0 24 24">
            <path fill="currentColor" d="M17.73 12.02l3.98-3.98a.996.996 0 0 0 0-1.41l-4.34-4.34a.996.996 0 0 0-1.41 0l-3.98 3.98L8 2.29a.996.996 0 0 0-1.41 0L2.25 6.63a.996.996 0 0 0 0 1.41l3.98 3.98L2.25 16a.996.996 0 0 0 0 1.41l4.34 4.34c.39.39 1.02.39 1.41 0l3.98-3.98 3.98 3.98c.2.2.45.29.71.29.26 0 .51-.1.71-.29l4.34-4.34c.39-.39.39-1.02 0-1.41l-3.99-3.98zM12 9c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4.71 1.96L3.66 7.34l3.63-3.63 3.62 3.62-3.62 3.63zM10 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2.66 9.34l-3.63-3.62 3.63-3.63 3.62 3.62-3.62 3.63z"/>
          </symbol>
          <symbol id="icon-database" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zm8 6c0 2.21-3.58 4-8 4s-8-1.79-8-4v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9zm0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3z"/>
          </symbol>
          <symbol id="icon-symptom" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </symbol>
          <symbol id="icon-soap" viewBox="0 0 24 24">
            <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z"/>
          </symbol>
          <symbol id="icon-medical" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3zM4 8h8v2H4zM4 13h8v2H4z"/>
          </symbol>
          <symbol id="icon-analytics" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </symbol>
          <symbol id="icon-clipboard" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </symbol>
          <symbol id="icon-upload" viewBox="0 0 24 24">
            <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
          </symbol>
        </defs>
      </svg>

      {/* Header */}
      <header className={isScrolled ? 'scrolled' : ''}>
        <div className="container">
          <div className="header-content">
            <div className="logo">Symra</div>
            <nav role="navigation" aria-label="Main navigation">
              <a href="#overview">Overview</a>
              <a href="#capabilities">Capabilities</a>
              <a href="#privacy">Privacy</a>
              <a href="#clinical">Clinical Output</a>
              <a href="#tech">Tech</a>
            </nav>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/auth" className="btn btn-secondary">Sign In</Link>
              <Link to="/dashboard" className="btn btn-primary">View Demo</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <div className="container">
          <div className="hero-container">
            <div className="hero-content">
              <h1>
                A calmer way to prepare for important medical conversations.
              </h1>
              <p className="subtitle">
                Symra helps you privately capture symptoms, track health patterns, and generate
                structured clinical notes — all without storing data in the cloud.
              </p>

              <div className="trust-badges" role="list">
                <div className="trust-badge" role="listitem">
                  <svg className="badge-icon" width="24" height="24" fill="var(--rose-500)">
                    <use href="#icon-lock"/>
                  </svg>
                  <span>Local-only storage</span>
                </div>
                <div className="trust-badge" role="listitem">
                  <svg className="badge-icon" width="24" height="24" fill="var(--rose-500)">
                    <use href="#icon-shield"/>
                  </svg>
                  <span>Privacy-first</span>
                </div>
                <div className="trust-badge" role="listitem">
                  <svg className="badge-icon" width="24" height="24" fill="var(--rose-500)">
                    <use href="#icon-no-cloud"/>
                  </svg>
                  <span>No cloud sync</span>
                </div>
                <div className="trust-badge" role="listitem">
                  <svg className="badge-icon" width="24" height="24" fill="var(--rose-500)">
                    <use href="#icon-user-check"/>
                  </svg>
                  <span>User-controlled</span>
                </div>
              </div>

              <div className="hero-ctas">
                <a href="#demo" className="btn btn-primary">View Demo</a>
                <a href="#privacy" className="btn btn-secondary">Read Privacy Architecture</a>
              </div>

              <div className="trust-line">
                No accounts · No cloud sync · No data resale
              </div>
            </div>

            {/* Live Timeline Preview with 3D effect - matches dashboard */}
            <div className="hero-mock-container">
              <div className="hero-mock" style={tiltStyle}>
                <div className="mock-header">
                  <svg className="mock-icon" width="32" height="32" fill="var(--rose-500)">
                    <use href="#icon-timeline"/>
                  </svg>
                  <h4>Health Timeline ({displayLogs.length} logs)</h4>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={handleAddSymptom}
                    style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                  >
                    + Add Log
                  </button>
                </div>
                <div className="space-y-4 relative">
                  {displayLogs.length > 0 && (
                    <div className="absolute left-[18px] top-4 bottom-4 w-px bg-slate-200 dark:bg-rose-muted/20"></div>
                  )}
                  {displayLogs.slice(0, 3).map((log, i) => {
                    const symptomTags = log.name.split(',').map(tag => tag.trim());
                    const [showAllTags, setShowAllTags] = React.useState(false);
                    const intensityColor = log.intensity <= 3 ? 'bg-green-500' : log.intensity <= 6 ? 'bg-yellow-500' : 'bg-red-500';
                    const intensityTextColor = log.intensity <= 3 ? 'text-green-600' : log.intensity <= 6 ? 'text-yellow-600' : 'text-red-600';
                    
                    return (
                      <div key={log.id} className="relative pl-12">
                        <div className={`absolute left-[15px] top-6 w-[7px] h-[7px] rounded-full ${
                          i === 0 ? 'bg-primary ring-4 ring-background-light dark:ring-background-dark' : 'bg-slate-300 dark:bg-rose-muted/50 ring-4 ring-background-light dark:ring-background-dark'
                        } z-10`}></div>
                        <details className="group" open={i === 0}>
                          <summary className="cursor-pointer">
                            <div className="timeline-card bg-white dark:bg-surface-dark border border-slate-200 dark:border-rose-muted/40 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                              <div className="flex flex-col gap-5">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-500 dark:text-rose-text uppercase tracking-widest">
                                    {new Date(log.timestamp).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-rose-muted/20 rounded-lg">
                                    <div className="w-[6px] h-[6px] rounded-full bg-primary"></div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Level {log.intensity}/10</span>
                                  </div>
                                </div>
                                <div className="flex items-center flex-wrap gap-2">
                                  {(showAllTags ? symptomTags : symptomTags.slice(0, 3)).map((tag, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-rose-muted/20 rounded-lg border border-slate-100 dark:border-rose-muted/10">
                                      <div className="w-[6px] h-[6px] rounded-full bg-primary"></div>
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{tag}</span>
                                    </div>
                                  ))}
                                  {symptomTags.length > 3 && !showAllTags && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowAllTags(true);
                                      }}
                                      className="text-[10px] font-bold text-rose-text hover:text-primary transition-colors cursor-pointer ml-2"
                                    >
                                      +{symptomTags.length - 3} ADDITIONAL
                                    </button>
                                  )}
                                  {symptomTags.length > 3 && showAllTags && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowAllTags(false);
                                      }}
                                      className="text-[10px] font-bold text-rose-text hover:text-primary transition-colors cursor-pointer ml-2"
                                    >
                                      SHOW LESS
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-12 pt-5 border-t border-slate-50 dark:border-rose-muted/10">
                                  <div className="flex-1 max-w-[240px]">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Symptom Intensity</span>
                                      <span className={`text-[10px] font-bold ${intensityTextColor}`}>
                                        Level {String(log.intensity).padStart(2, '0')} / 10
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-rose-muted/30 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${intensityColor}`}
                                        style={{ width: `${(log.intensity / 10) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  {log.triggers && log.triggers.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {log.triggers.map((trigger: string, idx: number) => (
                                        <span 
                                          key={idx}
                                          className="px-2 py-1 bg-slate-100 dark:bg-rose-muted/30 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-rose-muted/40 uppercase"
                                        >
                                          {trigger}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </summary>
                          <div className="mt-2 p-8 bg-white dark:bg-surface-dark border border-slate-200 dark:border-rose-muted/40 rounded-2xl">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">edit_note</span> 
                              USER NOTES & OBSERVATIONS
                            </h4>
                            {log.notes ? (
                              <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium space-y-4">
                                {log.notes.split('\n').map((paragraph, idx) => (
                                  <p key={idx}>{paragraph}</p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 italic">No specific observations were recorded for this timestamp.</p>
                            )}
                          </div>
                        </details>
                      </div>
                    );
                  })}
                  {displayLogs.length > 3 && (
                    <div className="text-center text-xs text-slate-500 dark:text-rose-text">
                      +{displayLogs.length - 3} more logs
                    </div>
                  )}
                  {displayLogs.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-slate-500 dark:text-rose-text font-medium mb-3">No logs yet. Start tracking your health!</p>
                      <button 
                        className="btn btn-primary" 
                        onClick={handleAddSymptom}
                      >
                        + Create Your First Log
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Flow Diagram */}
      <section className="data-flow-section scroll-animate">
        <div className="container">
          <h2 className="section-title">How Symra Works</h2>
          <p className="section-subtitle">
            A simple, powerful workflow from symptom to clinical conversation
          </p>

          <div className="flow-diagram" role="img" aria-label="Data flow from symptom logging to sharing">
            {dataFlowSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`flow-step ${currentFlowStep === index ? 'active' : ''}`}>
                  <div className="flow-icon-container">
                    <svg className="flow-icon" width="48" height="48" fill={currentFlowStep === index ? 'white' : 'var(--rose-500)'}>
                      <use href={`#icon-${step.label === 'Symptom' ? 'medical' : step.label.toLowerCase()}`}/>
                    </svg>
                  </div>
                  <div className="flow-label">{step.label}</div>
                </div>
                {index < dataFlowSteps.length - 1 && (
                  <div className="flow-connector"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* System Overview */}
      <section id="overview">
        <div className="container">
          <h2 className="section-title">More than a feature — a complete preparation system</h2>

          <div className="system-layers">
            {systemLayers.map((layer, index) => (
              <div key={index} className={`layer-card scroll-animate stagger-${index + 1}`}>
                <div className="layer-icon-container">
                  <svg width="32" height="32" fill="var(--rose-500)">
                    <use href={`#icon-${layer.icon}`}/>
                  </svg>
                </div>
                <div className="layer-content">
                  <h3>{layer.name}</h3>
                  <p>{layer.description}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="caption">
            Each layer builds clinical clarity from everyday observations.
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities">
        <div className="container">
          <h2 className="section-title">What Symra helps you do</h2>

          <div className="capabilities-grid">
            {capabilities.map((capability, index) => (
              <div key={capability.id} className={`capability-card scroll-animate stagger-${Math.min(index + 1, 5)}`}>
                <div
                  className="capability-header"
                  onClick={() => toggleCapability(capability.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCapability(capability.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedCapability === capability.id}
                >
                  <div className="capability-info">
                    <h3>
                      {capability.title}
                      <span className="capability-hint">{capability.hint}</span>
                    </h3>
                    <p>{capability.description}</p>
                  </div>
                  <span className={`expand-icon ${expandedCapability === capability.id ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
                <div className={`capability-details ${expandedCapability === capability.id ? 'expanded' : ''}`}>
                  <div className="capability-details-content">
                    <ul>
                      {capability.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Timeline Demo */}
      <section className="scroll-animate">
        <div className="container">
          <h2 className="section-title">See patterns emerge over time</h2>
          <div className="timeline-demo">
            <div className="demo-actions">
              <button className="btn btn-primary" onClick={handleAddSymptom}>
                + Add Symptom
              </button>
              <p className="demo-hint">Click to see timeline update with real data</p>
            </div>
            <div className="interactive-timeline">
              <div className="timeline-header">
                <h4>Your Health Timeline ({displayLogs.length} events)</h4>
                <div className="timeline-stats">
                  <span>Avg Intensity: {displayLogs.length > 0 ? Math.round(displayLogs.reduce((acc, log) => acc + log.intensity, 0) / displayLogs.length) : 0}/10</span>
                </div>
              </div>
              <div className="timeline-events">
                {displayLogs.length > 0 ? (() => {
                  // Calculate timeline bounds once
                  const oldestTime = Math.min(...displayLogs.map(l => l.timestamp));
                  const newestTime = Math.max(...displayLogs.map(l => l.timestamp));
                  const timeRange = newestTime - oldestTime || 1;
                  const recentLogs = displayLogs.slice().reverse().slice(0, 6);
                  
                  return recentLogs.map((log, index) => {
                    const timePosition = ((log.timestamp - oldestTime) / timeRange) * 80 + 10;
                    
                    return (
                      <div key={log.id} className="timeline-event" style={{ 
                        left: `${timePosition}%`,
                        top: `${50 - (log.intensity / 10) * 40}%`
                      }}>
                        <div className="event-dot" style={{ 
                          backgroundColor: log.intensity <= 3 ? '#10b981' : log.intensity <= 6 ? '#f59e0b' : '#ef4444',
                          width: `${12 + log.intensity * 0.8}px`,
                          height: `${12 + log.intensity * 0.8}px`
                        }}></div>
                        <div className="event-label">
                          <div className="event-name">{log.name.split(',')[0].trim()}</div>
                          <div className="event-intensity">Level {log.intensity}</div>
                          <div className="event-time">{new Date(log.timestamp).toLocaleDateString()}</div>
                        </div>
                      </div>
                    );
                  });
                })() : (
                  <div className="empty-timeline">
                    <div className="empty-icon">📊</div>
                    <p>No health events yet. Add your first symptom to see patterns!</p>
                    <button className="btn btn-primary" onClick={handleAddSymptom} style={{ marginTop: '1rem' }}>
                      + Add First Symptom
                    </button>
                  </div>
                )}
              </div>
              <div className="timeline-legend">
                <div className="legend-item">
                  <div className="legend-dot low"></div>
                  <span>Low (1-3)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot medium"></div>
                  <span>Medium (4-6)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot high"></div>
                  <span>High (7-10)</span>
                </div>
              </div>
              {displayLogs.length > 0 && (
                <div className="timeline-insights">
                  <h5>Quick Insights</h5>
                  <div className="insights-grid">
                    <div className="insight-item">
                      <span className="insight-label">Most Recent:</span>
                      <span className="insight-value">{displayLogs[displayLogs.length - 1]?.name.split(',')[0] || 'None'}</span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-label">Highest Intensity:</span>
                      <span className="insight-value">Level {Math.max(...displayLogs.map(l => l.intensity))}/10</span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-label">Total Events:</span>
                      <span className="insight-value">{displayLogs.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy">
        <div className="container">
          <h2 className="section-title">Designed for privacy from the first line of code</h2>

          <div className="privacy-visual scroll-animate">
            <div className="privacy-visual-content">
              <svg width="80" height="80" fill="var(--rose-500)" style={{ animation: 'iconPulse 2s ease-in-out infinite' }}>
                <use href="#icon-lock"/>
              </svg>
              <span style={{ fontSize: '3rem', color: 'var(--rose-gray)' }}>→</span>
              <svg width="80" height="80" fill="var(--rose-gray)" style={{ opacity: 0.3 }}>
                <use href="#icon-no-cloud"/>
              </svg>
            </div>
          </div>

          <ul className="privacy-list">
            <li>All health data stored locally in the browser</li>
            <li>No accounts, no servers, no telemetry</li>
            <li>AI used only when the user explicitly requests it</li>
            <li>Outputs are reviewable and exportable</li>
          </ul>
        </div>
      </section>

      {/* Clinical Responsibility */}
      <section className="scroll-animate">
        <div className="container">
          <h2 className="section-title">Clear medical boundaries</h2>

          <div className="disclaimer-box">
            <p style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1.1rem' }}>
              Important clinical limitations:
            </p>
            <ul>
              <li>Not a diagnostic tool</li>
              <li>No treatment or medication recommendations</li>
              <li>Supports communication, not clinical decision-making</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Clinical Output */}
      <section id="clinical">
        <div className="container">
          <h2 className="section-title">Structured outputs doctors recognize</h2>

          <div className="preview-grid">
            <div className="preview-card scroll-animate stagger-1" tabIndex={0}>
              <div className="preview-icon-container">
                <svg width="40" height="40" fill="var(--rose-500)">
                  <use href="#icon-document"/>
                </svg>
              </div>
              <h3>SOAP Note Document</h3>
              <p>
                Professional clinical format with Subjective, Objective, Assessment, and Plan
                sections ready for physician review.
              </p>
            </div>

            <div className="preview-card scroll-animate stagger-2" tabIndex={0}>
              <div className="preview-icon-container">
                <svg width="40" height="40" fill="var(--rose-500)">
                  <use href="#icon-timeline"/>
                </svg>
              </div>
              <h3>Health Timeline</h3>
              <p>
                Visual representation of symptoms and events over time, showing patterns and
                correlations.
              </p>
            </div>

            <div className="preview-card scroll-animate stagger-3" tabIndex={0}>
              <div className="preview-icon-container">
                <svg width="40" height="40" fill="var(--rose-500)">
                  <use href="#icon-qr"/>
                </svg>
              </div>
              <h3>QR-Shared Visit Summary</h3>
              <p>
                Secure, one-time sharing of your health summary directly with your healthcare
                provider.
              </p>
            </div>
          </div>

          <p className="caption">Built to reduce friction during real appointments.</p>
        </div>
      </section>

      {/* Engineering */}
      <section id="tech" className="scroll-animate">
        <div className="container">
          <h2 className="section-title">Engineered for reliability and trust</h2>

          <ul className="tech-list">
            <li tabIndex={0}>React + TypeScript for maintainability</li>
            <li tabIndex={0}>Offline-first local storage architecture</li>
            <li tabIndex={0}>Schema-validated data models</li>
            <li tabIndex={0}>Portable PDF exports</li>
            <li tabIndex={0}>Optional AI-assisted synthesis</li>
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Healthcare tools should feel careful — not loud</h2>

          <div className="final-cta-buttons">
            <a href="#demo" className="btn btn-primary">Explore the Demo</a>
            <a href="#source" className="btn btn-secondary">View Source Code</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <p>Built for Dev Season of Code 2026</p>
          <p style={{ marginTop: '0.75rem' }}>Privacy-first by design</p>
        </div>
      </footer>

      {/* Theme Toggle */}
      <button
        className="theme-toggle"
        onClick={() => setIsDark(!isDark)}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? '☀' : '🌙'}
      </button>
    </div>
  );
};

export default SymraLanding;