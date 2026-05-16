import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, UploadCloud, CheckCircle, RefreshCw, AlertCircle, Map, Clock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

// ─── EXPANDED KARNATAKA GEOGRAPHIC DATA TREE (~100 PLACES) ──────────────────
const karnatakaLocations = {
  "Bengaluru Urban": {
    "Bengaluru North": ["Malleswaram", "Hebbal", "Yelahanka", "Jalahalli", "Vidyaranyapura", "RT Nagar", "Sadashivanagar"],
    "Bengaluru South": ["Jayanagar", "Basavanagudi", "Koramangala", "BTM Layout", "Banashankari", "JP Nagar", "Uttarahalli"],
    "Bengaluru East": ["Indiranagar", "Whitefield", "Marathahalli", "KR Puram", "Bellandur", "HSR Layout", "Mahadevapura"],
    "Bengaluru West": ["Rajajinagar", "Vijayanagar", "Kengeri", "Nagarbhavi", "Malleshwaram West", "Magadi Road"]
  },
  "Dharwad": {
    "Dharwad": ["Navanagar", "Saptapur", "Srinagar", "Malmaddi", "Kalyan Nagar", "Chalakaveni", "Barakotri", "Gulganjikoppa"],
    "Hubballi": ["Vidyanagar", "Gokul Road", "Keshwapur", "Deshpande Nagar", "Old Hubli", "Bhavani Nagar", "Raviwar Peth"],
    "Navalgund": ["Navalgund Town", "Alagawadi", "Arekurahatti", "Shalavadi", "Morab"],
    "Kundgol": ["Kundgol Town", "Yaliwal", "Kubihal", "Mattigatti", "Sansenshi"]
  },
  "Bagalkot": {
    "Bagalkot": ["Vidyagiri", "Navanagar Sector 1", "Navanagar Sector 2", "Old Bagalkot", "Kaulpet", "Simikeri"],
    "Badami": ["Badami Town", "Kulageri", "Kerur", "Belur", "Cholachagudd"],
    "Ilkal": ["Ilkal Town", "Gudur", "Hungund", "Karadi", "Amingad"],
    "Jamkhandi": ["Jamkhandi Town", "Mudhol", "Mahalingpur", "Banahatti", "Savalagi"]
  },
  "Belagavi": {
    "Belagavi": ["Tilakwadi", "Camp Area", "Hindwadi", "Shahapur", "Vadgaon", "Angol", "Anagol"],
    "Gokak": ["Gokak Town", "Falls Road", "Konnur", "Arbhavi", "Ankalagi"],
    "Chikodi": ["Chikodi Town", "Nipani", "Sadalga", "Examba", "Ankali"]
  },
  "Mysuru": {
    "Mysuru": ["Gokulam", "Kuvempunagar", "Saraswathipuram", "Jayalakshmipuram", "Vijayanagar", "Hebbal Mysuru"],
    "Nanjangud": ["Nanjangud Town", "Sujathapuram", "Thandavapura", "Hullahalli"],
    "Hunsur": ["Hunsur Town", "Bilikere", "Gavadagere", "Hanagod"]
  }
};

const Upload = () => {
  const { isConnected } = useAppStore();
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [uploadState, setUploadState] = useState('idle'); // idle, processing, success
  
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTaluk, setSelectedTaluk] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      alert("Camera access configuration mismatch or permission denied.");
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Silent GPS fallback triggered.")
      );
    }
  };

  // ─── PRODUCTION FRONTEND-TO-BACKEND INTEGRATION LOOP ─────────────────────
  const handleSubmit = async () => {
    setUploadState('processing');
    
    try {
      // 1. Resolve raw base64 data string layer down to a binary file Blob
      const response = await fetch(capturedImage);
      const imageBlob = await response.blob();
      
      // 2. Wrap payloads into standard Form-Data boundary allocations for Multer parsing
      const formData = new FormData();
      formData.append('image', imageBlob, 'evidence.jpg'); 
      formData.append('latitude', gpsLocation?.lat || '');
      formData.append('longitude', gpsLocation?.lng || '');
      formData.append('district', selectedDistrict);
      formData.append('taluk', selectedTaluk);
      formData.append('village', selectedVillage);

      // 3. Dispatch true stateless HTTP POST frame across your Express gateway port
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const apiResponse = await fetch(`${API_URL}/report/upload`, {
        method: 'POST',
        // headers: { 'Authorization': `Bearer ${token}` }, // Add when JWT routing is complete
        body: formData 
      });

      if (!apiResponse.ok) {
        throw new Error(`Mainframe HTTP communication failure status: ${apiResponse.status}`);
      }

      const responseData = await apiResponse.json();
      console.log("✅ Mainframe confirmation receipt:", responseData);

      // 4. Switch layout state into animated confirmation card on true API success
      setUploadState('success');
      
      setTimeout(() => {
        setCapturedImage(null);
        setGpsLocation(null);
        setSelectedDistrict('');
        setSelectedTaluk('');
        setSelectedVillage('');
        setUploadState('idle');
      }, 3500);

    } catch (error) {
      console.error("❌ Operational Pipeline Crash:", error);
      alert("Mainframe synchronization aborted. Ensure your local Node backend server is live on Port 5000.");
      setUploadState('idle');
    }
  };

  const availableDistricts = Object.keys(karnatakaLocations);
  const availableTaluks = selectedDistrict ? Object.keys(karnatakaLocations[selectedDistrict]) : [];
  const availableVillages = selectedTaluk ? karnatakaLocations[selectedDistrict][selectedTaluk] : [];
  const isLocationComplete = selectedDistrict && selectedTaluk && selectedVillage;

  return (
    <div className="max-w-4xl mx-auto pt-8 px-4 sm:px-6 mb-12">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        
        <header className="mb-10 text-center relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">Report Garbage</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium">Capture evidence and send it for Admin verification.</p>
        </header>

        {/* Cinematic Viewport Grid */}
        <div className="relative w-full aspect-[4/3] sm:aspect-video bg-black/90 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-200 dark:border-gray-800">
          {!isCameraActive && !capturedImage && (
            <button onClick={startCamera} className="flex flex-col items-center text-gray-400 hover:text-white transition-colors z-10 group">
              <div className="p-6 bg-gray-800/80 backdrop-blur-md rounded-2xl group-hover:bg-green-500 transition-all duration-300 mb-4 shadow-xl">
                <Camera size={48} />
              </div>
              <span className="font-bold tracking-wide text-sm text-gray-400 group-hover:text-white">Open Device Camera</span>
            </button>
          )}
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover transition-opacity duration-500 ${!isCameraActive ? 'opacity-0 hidden' : 'opacity-100'}`}></video>
          {capturedImage && <img src={capturedImage} alt="Captured garbage" className="w-full h-full object-cover" />}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        <div className="mt-8">
          {isCameraActive && (
            <button onClick={takeSnapshot} className="w-full bg-white text-black py-5 rounded-2xl font-extrabold text-xl hover:bg-gray-200 transition-colors shadow-lg">
              Capture Evidence
            </button>
          )}

          {capturedImage && (
            <AnimatePresence mode="wait">
              {uploadState === 'idle' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6">
                  
                  {/* Dropdown Input Selector Matrices */}
                  <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4 text-gray-700 dark:text-gray-300">
                      <Map size={18} />
                      <span className="text-sm font-bold uppercase tracking-wider">Geographic Boundary Path</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* District Allocation */}
                      <select value={selectedDistrict} onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedTaluk(''); setSelectedVillage(''); }} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 transition-all cursor-pointer">
                        <option value="" disabled>Select District</option>
                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>

                      {/* Taluk Allocation */}
                      <select value={selectedTaluk} onChange={(e) => { setSelectedTaluk(e.target.value); setSelectedVillage(''); }} disabled={!selectedDistrict} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        <option value="" disabled>Select Taluk / Region</option>
                        {availableTaluks.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>

                      {/* Area/Village Allocation */}
                      <select value={selectedVillage} onChange={(e) => setSelectedVillage(e.target.value)} disabled={!selectedTaluk} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        <option value="" disabled>Select Area / Village</option>
                        {availableVillages.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Operational Layout Action Commits */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button onClick={() => { setCapturedImage(null); startCamera(); }} className="py-5 px-8 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-bold transition-colors flex items-center justify-center space-x-2 hover:bg-gray-200 dark:hover:bg-gray-700">
                      <RefreshCw size={20} /><span>Retake</span>
                    </button>
                    <button onClick={handleSubmit} disabled={!isLocationComplete} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg flex justify-center items-center space-x-2">
                      <UploadCloud size={20} />
                      <span>{!isLocationComplete ? 'Complete Location Parameters' : 'Dispatch to System Admin'}</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Server Stream Transmission Phase */}
              {uploadState === 'processing' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                  <h3 className="text-2xl font-bold dark:text-white mb-2">Securely Uploading Data...</h3>
                  <p className="text-sm text-gray-500 font-medium">Encrypting binary multi-part boundaries for cloud server distribution.</p>
                </motion.div>
              )}

              {/* Finalized Data Commit Hook Confirmation */}
              {uploadState === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-inner"><CheckCircle size={40} /></div>
                  <h3 className="text-3xl font-extrabold dark:text-white mb-2">Mainframe Synchronized!</h3>
                  <p className="text-gray-500 max-w-sm mx-auto text-sm mb-6">Your data was successfully logged in the database registry queue.</p>
                  <div className="bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-6 py-3 rounded-xl font-bold text-sm tracking-wide flex items-center space-x-2 w-fit mx-auto">
                    <Clock size={16} />
                    <span>Awaiting Administrative Review Queue Audit</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Upload;