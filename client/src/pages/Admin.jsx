import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, XCircle, Clock, Activity, Server } from 'lucide-react';

const SOCKET_SERVER_URL = 'http://localhost:5000';

const Admin = () => {
  const [reports, setReports] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch(`${SOCKET_SERVER_URL}/api/report/pending`);
        const data = await res.json();
        if (data.success) {
          setReports(data.reports.map(r => ({
            id: r._id,
            user: r.userId?.email || 'shreeaarushi5@gmail.com',
            location: r.address,
            status: 'Awaiting Manual Review',
            time: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
        }
      } catch (err) {
        console.error("Database connection failed:", err);
      }
    };
    fetchQueue();

    const socket = io(SOCKET_SERVER_URL, { withCredentials: true });
    socket.on('new_report_submitted', (newReport) => {
      setReports(prev => [newReport, ...prev]);
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleVerify = (id, action) => {
    setProcessingId(id);
    fetch(`${SOCKET_SERVER_URL}/api/admin/verify/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action === 'verified' ? 'verified' : 'rejected' })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) setReports(prev => prev.filter(r => r.id !== id));
      setProcessingId(null);
    })
    .catch(() => setProcessingId(null));
  };

  return (
    <div className="max-w-7xl mx-auto pt-8 px-4">
      <div className="space-y-8">
        <header className="flex justify-between items-end pb-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-4xl font-extrabold dark:text-white flex items-center space-x-3">
            <ShieldAlert className="text-red-500" size={36} /><span>Admin Control Center</span>
          </h1>
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 text-blue-600 rounded-full font-bold border border-blue-500/20">
            <Server size={18} className="animate-pulse" /><span>Mainframe Connected</span>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Pending Verification', value: reports.length.toString(), color: 'text-orange-500' },
            { label: 'Reports Today', value: '156', color: 'text-blue-500' },
            { label: 'Total Verified', value: '8,432', color: 'text-green-500' },
            { label: 'Fraud Flagged', value: '12', color: 'text-red-500' }
          ].map((stat, i) => (
            <div key={i} className="glass p-6 rounded-[2rem] shadow-lg">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">{stat.label}</p>
              <h3 className={`text-4xl font-black ${stat.color}`}>{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="glass rounded-[2rem] p-8 shadow-xl">
          <h3 className="text-2xl font-bold dark:text-white flex items-center mb-6"><Clock className="text-orange-500 mr-3" size={28} />Action Required Queue</h3>
          <div className="space-y-4">
            <AnimatePresence>
              {reports.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                  <p className="text-xl text-gray-500 font-bold">Queue is empty. Great job!</p>
                </motion.div>
              ) : (
                reports.map((report) => (
                  <motion.div key={report.id} exit={{ opacity: 0, scale: 0.95 }} className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 flex flex-col lg:flex-row items-center justify-between border dark:border-gray-700/50">
                    <div className="flex-grow w-full lg:w-auto mb-4 lg:mb-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm font-black text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md">{report.id}</span>
                        <span className="text-xs bg-orange-500/10 text-orange-600 border border-orange-500/20 px-3 py-1 rounded-full font-bold tracking-wider">{report.status}</span>
                      </div>
                      <p className="text-lg font-bold dark:text-white">{report.location}</p>
                      <p className="text-sm text-gray-500">Submitted by: <span className="text-blue-500">{report.user}</span> • {report.time}</p>
                    </div>
                    <div className="flex space-x-3 w-full lg:w-auto">
                      <button onClick={() => handleVerify(report.id, 'rejected')} disabled={processingId === report.id} className="flex-1 lg:flex-none flex items-center justify-center space-x-2 bg-red-50 text-red-600 dark:bg-red-900/20 px-6 py-3 rounded-xl font-bold disabled:opacity-50">
                        <XCircle size={20} /><span>Reject</span>
                      </button>
                      <button onClick={() => handleVerify(report.id, 'verified')} disabled={processingId === report.id} className="flex-1 lg:flex-none flex items-center justify-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50">
                        {processingId === report.id ? <Clock size={20} className="animate-spin" /> : <><CheckCircle size={20} /><span>Verify & Issue Reward</span></>}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;