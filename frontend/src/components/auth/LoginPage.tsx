import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, BarChart3, Brain, Shield, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Animated stock chart SVG component
function AnimatedChart() {
  return (
    <svg
      viewBox="0 0 400 200"
      className="w-full h-48 md:h-64"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Animated line chart path */}
      <motion.path
        d="M 0 150 Q 50 140, 80 120 T 150 100 T 220 80 T 280 90 T 340 50 T 400 30"
        fill="none"
        stroke="url(#chartGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Area fill under the chart */}
      <motion.path
        d="M 0 150 Q 50 140, 80 120 T 150 100 T 220 80 T 280 90 T 340 50 T 400 30 L 400 200 L 0 200 Z"
        fill="url(#areaGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      />

      {/* Animated data points */}
      {[
        { x: 80, y: 120, delay: 0.5 },
        { x: 150, y: 100, delay: 0.8 },
        { x: 220, y: 80, delay: 1.1 },
        { x: 280, y: 90, delay: 1.4 },
        { x: 340, y: 50, delay: 1.7 },
      ].map((point, i) => (
        <motion.circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="6"
          fill="#3b82f6"
          stroke="white"
          strokeWidth="2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: point.delay }}
        />
      ))}
    </svg>
  );
}

// Floating particles component
function FloatingParticles() {
  const particles = [
    { icon: TrendingUp, x: '10%', y: '20%', delay: 0 },
    { icon: BarChart3, x: '80%', y: '30%', delay: 0.5 },
    { icon: Brain, x: '20%', y: '70%', delay: 1 },
    { icon: Shield, x: '70%', y: '80%', delay: 1.5 },
  ];

  return (
    <>
      {particles.map((particle, i) => {
        const Icon = particle.icon;
        return (
          <motion.div
            key={i}
            className="absolute text-white/10"
            style={{ left: particle.x, top: particle.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.15, 0],
              scale: [0.8, 1.2, 0.8],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 4,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon className="h-12 w-12" />
          </motion.div>
        );
      })}
    </>
  );
}

// Feature item component
function FeatureItem({ icon: Icon, text, delay }: { icon: typeof TrendingUp; text: string; delay: number }) {
  return (
    <motion.div
      className="flex items-center gap-3 text-blue-100/80"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm">{text}</span>
    </motion.div>
  );
}

export function LoginPage() {
  const { login, loginAsGuest, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-900">
      {/* Left Side - Hero Section */}
      <div className="relative flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

        {/* Floating particles */}
        <FloatingParticles />

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg shadow-blue-500/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">InvestIQ</h1>
              <p className="text-sm text-blue-200/70">AI-Powered Investment Research</p>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Smart investing starts with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              smart research
            </span>
          </motion.h2>

          <motion.p
            className="text-blue-100/60 mb-8 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Get comprehensive stock analysis, AI-powered insights, and real-time market data all in one place.
          </motion.p>

          {/* Animated Chart */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <AnimatedChart />
          </motion.div>

          {/* Features */}
          <div className="space-y-3">
            <FeatureItem icon={BarChart3} text="Real-time market data & technical analysis" delay={0.8} />
            <FeatureItem icon={Brain} text="AI-generated investment briefs" delay={0.9} />
            <FeatureItem icon={TrendingUp} text="Track your personalized watchlist" delay={1.0} />
          </div>
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 lg:px-16 bg-slate-800/50">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
            {/* Card Header */}
            <div className="text-center mb-8">
              <motion.div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">Welcome to InvestIQ</h3>
              <p className="text-slate-400 text-sm">Sign in to access your personalized dashboard</p>
            </div>

            {/* Login Buttons */}
            <div className="space-y-4">
              {/* Google Sign In */}
              <motion.button
                onClick={login}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-gray-800 rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLoading ? 'Signing in...' : 'Continue with Google'}
              </motion.button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-800 text-slate-400">or</span>
                </div>
              </div>

              {/* Guest Mode */}
              <motion.button
                onClick={loginAsGuest}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-transparent border border-slate-600 text-slate-300 rounded-xl font-medium hover:border-blue-500 hover:text-white hover:bg-blue-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <User className="h-5 w-5" />
                Continue as Guest
              </motion.button>
            </div>

            {/* Guest disclaimer */}
            <motion.p
              className="text-center text-xs text-slate-500 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Guest mode: Browse stocks without saving watchlists
            </motion.p>
          </div>

          {/* Footer */}
          <motion.p
            className="text-center text-xs text-slate-500 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            By continuing, you agree to InvestIQ's Terms of Service and Privacy Policy
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
