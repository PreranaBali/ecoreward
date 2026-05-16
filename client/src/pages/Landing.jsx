import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Camera, ShieldCheck, Banknote } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <div className="p-4 bg-green-500/10 rounded-full mb-6">
        <Leaf className="text-green-500 w-16 h-16" />
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-600 mb-6 tracking-tight">
        Clean the City. <br /> Earn Rewards.
      </h1>
      
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Join the smart community revolution. Snap photos of garbage, let our AI verify the cleanup, and earn points redeemable for real-world perks.
      </p>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-20">
        <Link 
          to="/dashboard" 
          className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-green-500/30 transition-all hover:-translate-y-1"
        >
          Start Earning Now
        </Link>
        <button className="glass font-bold text-lg px-8 py-4 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white">
          Learn How It Works
        </button>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
        <div className="glass p-8 rounded-3xl text-left">
          <Camera className="text-blue-500 mb-4 h-10 w-10" />
          <h3 className="text-xl font-bold mb-2 dark:text-white">1. Snap & Upload</h3>
          <p className="text-gray-500">Take a photo of garbage. Our system grabs the secure GPS and timestamp metadata.</p>
        </div>
        <div className="glass p-8 rounded-3xl text-left">
          <ShieldCheck className="text-green-500 mb-4 h-10 w-10" />
          <h3 className="text-xl font-bold mb-2 dark:text-white">2. AI Verification</h3>
          <p className="text-gray-500">TensorFlow AI analyzes the image to prevent fraud and ensure accurate reporting.</p>
        </div>
        <div className="glass p-8 rounded-3xl text-left">
          <Banknote className="text-orange-500 mb-4 h-10 w-10" />
          <h3 className="text-xl font-bold mb-2 dark:text-white">3. Get Rewarded</h3>
          <p className="text-gray-500">Points are instantly credited to your wallet, climbing you up the leaderboard.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;