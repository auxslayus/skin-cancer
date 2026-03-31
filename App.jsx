import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Upload, Shield, History, Activity, Info,
    CheckCircle, AlertTriangle, Loader, Camera,
    LogOut, User as UserIcon, LogIn, Download, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

// Components
import Login from './components/Login';
import Signup from './components/Signup';
import Landing from './components/Landing';

const API_BASE_URL = '/api';

const App = () => {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('landing'); // landing, auth, app
    const [authMode, setAuthMode] = useState('login'); // login, signup
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('analyze');
    const [initialized, setInitialized] = useState(false);

    const reportRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            setView('app');
        }
        setInitialized(true);
        
        // Prevent going back to Auth/Landing if user is logged in
        const handlePopState = (e) => {
            if (localStorage.getItem('token') || localStorage.getItem('user')) {
                window.history.pushState(null, '', window.location.href);
            }
        };
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchHistory = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/history`, {
                headers: getAuthHeader()
            });
            setHistory(response.data);
        } catch (error) {
            if (error.response?.status === 401) handleLogout();
            console.error("Error fetching history:", error);
        }
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'Logged Out',
            text: 'You have been successfully logged out.',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false,
            background: '#0f172a',
            color: '#f1f5f9'
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setView('landing');
        setAuthMode('login');
    };

    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#020617',
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`DermAI-Report-${new Date().getTime()}.pdf`);
        } catch (err) {
            console.error("PDF export failed:", err);
            alert("Could not generate PDF. Please try again.");
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setResult(null);
        }
    };

    const handleUpload = async () => {
        console.log('DEBUG: handleUpload triggered');
        console.log('DEBUG: file state:', file ? file.name : 'null');
        console.log('DEBUG: loading state:', loading);

        if (!file) {
            console.warn('DEBUG: No file selected');
            alert("Please select a file first");
            return;
        }

        setLoading(true);
        console.log('DEBUG: Sending request to:', `${API_BASE_URL}/upload`);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
                headers: {
                    ...getAuthHeader()
                }
            });
            setResult(response.data.scan);
            fetchHistory();
        } catch (error) {
            console.error("Analysis failed:", error);
            if (error.response?.status === 422) {
                // Image relevancy error
                Swal.fire({
                    title: 'Invalid Image',
                    text: error.response?.data?.details || 'This image is not related to skin lesion analysis.',
                    icon: 'error',
                    confirmButtonText: 'Try Again',
                    background: '#0f172a',
                    color: '#f1f5f9',
                    confirmButtonColor: '#3b82f6',
                    backdrop: `rgba(0,0,123,0.4)`
                });
                setFile(null);
                setPreview(null);
            } else {
                alert(error.response?.data?.details || "Analysis failed. Please check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!initialized) return null;

    // View: Landing
    if (view === 'landing' && !user) {
        return <Landing onGetStarted={() => setView('auth')} />;
    }

    // View: Auth (Login/Signup)
    if (view === 'auth' && !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

                <div className="z-10 w-full flex flex-col items-center">
                    <button
                        onClick={() => setView('landing')}
                        className="mb-8 text-slate-500 hover:text-white transition-colors font-bold flex items-center gap-2"
                    >
                        &larr; Back to Home
                    </button>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 mb-12"
                    >
                        <Shield className="w-12 h-12 text-blue-500" />
                        <span className="text-4xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tighter">
                            DERMAI
                        </span>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {authMode === 'login' ? (
                            <Login
                                key="login"
                                onLogin={(u) => { setUser(u); setView('app'); }}
                                onSwitch={() => setAuthMode('signup')}
                            />
                        ) : (
                            <Signup
                                key="signup"
                                onSignup={(u) => { setUser(u); setView('app'); }}
                                onSwitch={() => setAuthMode('login')}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    // View: Main App (Requires Logged-in User)
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500Selection:text-white">
            <nav className="border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
                        <div className="bg-blue-600/20 p-2 rounded-xl">
                            <Shield className="w-8 h-8 text-blue-500" />
                        </div>
                        <span className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tighter">
                            DermAI
                        </span>
                    </div>

                    <div className="hidden md:flex bg-slate-800/40 p-1 rounded-2xl border border-slate-700/50">
                        <button
                            onClick={() => setActiveTab('analyze')}
                            className={`px-6 py-2 rounded-xl transition-all font-medium flex items-center gap-2 ${activeTab === 'analyze' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-slate-700/50 text-slate-400'}`}
                        >
                            <Activity className="w-4 h-4" /> Analyze
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2 rounded-xl transition-all font-medium flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-slate-700/50 text-slate-400'}`}
                        >
                            <History className="w-4 h-4" /> History
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <span className="text-xs font-medium text-slate-300 max-w-[120px] truncate">{user?.email}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all border border-slate-700/50"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6 md:p-12">
                <AnimatePresence mode="wait">
                    {activeTab === 'analyze' ? (
                        <motion.div
                            key="analyze"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <header className="text-center space-y-4 mb-12">
                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-5xl md:text-6xl font-black tracking-tight"
                                >
                                    Clinical <span className="text-blue-500">Analysis</span>
                                </motion.h1>
                                <p className="text-lg text-slate-400 max-w-xl mx-auto">
                                    Our AI uses neural networks to analyze skin lesions for signs of malignancy with professional-grade precision.
                                </p>
                            </header>

                            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/20 hover:border-blue-500/50 transition-all relative">
                                    {preview ? (
                                        <div className="relative w-full aspect-square max-w-md rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => { setPreview(null); setFile(null); setResult(null); }}
                                                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full shadow-xl transition-all"
                                            >
                                                <LogOut className="w-5 h-5 rotate-180" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                                                <Camera className="w-10 h-10 text-slate-500 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <p className="text-xl font-bold text-white mb-2">Upload Lesion Image</p>
                                            <p className="text-slate-400 mb-8">Drag and drop or browse clear, close-up photos</p>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer z-20"
                                            >
                                                Browse Gallery
                                            </button>
                                        </>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={!file || loading}
                                    className={`w-full mt-8 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 transition-all relative z-50 pointer-events-auto ${!file || loading
                                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                                        : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-2xl shadow-blue-900/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                                        }`}
                                >
                                    {loading ? (
                                        <><Loader className="w-7 h-7 animate-spin" /> RUNNING ANALYSIS...</>
                                    ) : (
                                        <><Activity className="w-7 h-7" /> START ANALYSIS</>
                                    )}
                                </button>

                                <div className="mt-2 text-center text-[10px] text-slate-600 font-mono">
                                    DEBUG: File:{file ? 'SET' : 'NONE'} | Preview:{preview ? 'SET' : 'NONE'} | Loading:{loading ? 'YES' : 'NO'} | View:{view}
                                </div>
                            </div>

                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        ref={reportRef}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className={`p-8 rounded-3xl border-2 shadow-2xl overflow-hidden relative ${result.prediction.is_cancerous ? 'bg-red-950/20 border-red-500/30' : 'bg-emerald-950/20 border-emerald-500/30'}`}
                                    >
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 ${result.prediction.is_cancerous ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

                                        <div className="flex items-start gap-6">
                                            <div className={`p-4 rounded-2xl ${result.prediction.is_cancerous ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                                                {result.prediction.is_cancerous ? (
                                                    <AlertTriangle className="w-10 h-10 text-red-500 shrink-0" />
                                                ) : (
                                                    <CheckCircle className="w-10 h-10 text-emerald-500 shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="text-3xl font-black text-white">
                                                        {result.prediction.class}
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${result.prediction.is_cancerous ? 'bg-red-500 text-white shadow-lg shadow-red-900/40' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'}`}>
                                                            {result.prediction.is_cancerous ? 'Caution' : 'Passed'}
                                                        </span>
                                                        <button
                                                            onClick={handleExportPDF}
                                                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-blue-400 transition-colors border border-slate-700"
                                                            title="Download Report"
                                                        >
                                                            <Download className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${result.prediction.confidence * 100}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className={`h-full ${result.prediction.is_cancerous ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                        ></motion.div>
                                                    </div>
                                                    <span className="font-mono text-xl font-bold text-white">
                                                        {(result.prediction.confidence * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                                                    {result.prediction.is_cancerous
                                                        ? 'Our analysis has detected characteristics often associated with malignant lesions. Immediate consultation with a dermatologist is strongly advised.'
                                                        : 'The analysis suggests a low probability of malignancy. However, any changing skin lesion should be monitored by a healthcare professional.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-slate-700/50 text-sm text-slate-400 flex items-center gap-3">
                                            <Info className="w-5 h-5 text-blue-500" />
                                            <span>
                                                <strong>Medical Disclaimer:</strong> This is an AI triage tool for educational purposes only. It is not a clinical diagnosis. Always consult a certified dermatologist for medical advice.
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-4xl font-black mb-2">Your <span className="text-blue-500">History</span></h2>
                                    <p className="text-slate-400 italic">Tracking your skin health over time</p>
                                </div>
                                <div className="text-slate-500 text-sm font-bold">
                                    {history.length} SCANS PERFORMED
                                </div>
                            </div>

                            <div className="grid gap-6">
                                {history.length === 0 ? (
                                    <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 border-dashed">
                                        <History className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                        <p className="text-slate-500 text-xl font-bold uppercase tracking-widest">No previous scans found</p>
                                        <button onClick={() => setActiveTab('analyze')} className="mt-4 text-blue-500 hover:underline">Start your first scan</button>
                                    </div>
                                ) : (
                                    history.map((item, index) => (
                                        <motion.div
                                            key={item._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                                            className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center gap-6 hover:border-blue-500/30 transition-all hover:bg-slate-900 shadow-xl group"
                                        >
                                            <div className="relative">
                                                <img src={item.imageUrl} className="w-24 h-24 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform" alt="Scan" />
                                                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-4 border-slate-900 flex items-center justify-center ${item.prediction?.is_cancerous ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-black text-xl text-white">{item.prediction?.class}</h4>
                                                    <span className="text-xs font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest">
                                                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className={`h-full ${item.prediction?.is_cancerous ? 'bg-red-500' : 'bg-blue-500'} transition-all`} style={{ width: `${(item.prediction?.confidence || 0) * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-300">{((item.prediction?.confidence || 0) * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            <div className={`hidden sm:flex px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${item.prediction?.is_cancerous ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                                {item.prediction?.is_cancerous ? 'Caution' : 'Healthy'}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default App;
