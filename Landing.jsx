import React from 'react';
import { motion } from 'framer-motion';
import {
    Shield, Activity, History, ChevronRight,
    CheckCircle2, Globe, Lock, Star, Award
} from 'lucide-react';

const Landing = ({ onGetStarted }) => {
    return (
        <div className="bg-slate-950 text-white selection:bg-blue-500 overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
                {/* Background Blobs */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse animation-delay-2000"></div>

                <div className="max-w-6xl mx-auto text-center z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold mb-8"
                    >
                        <Award className="w-4 h-4" /> Trusted by Clinical Researchers
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
                    >
                        Precision <span className="text-blue-500">AI</span> for <br />
                        <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic">Skin Health</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        Advanced neural networks designed to triage skin lesions with
                        professional accuracy. Privacy-first, medically backed analysis.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <button
                            onClick={onGetStarted}
                            className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xl flex items-center gap-3 shadow-2xl shadow-blue-900/40 transition-all active:scale-95"
                        >
                            Start Free Analysis <ChevronRight className="w-6 h-6" />
                        </button>
                        <a href="#features" className="text-slate-400 hover:text-white font-bold text-lg transition-colors border-b border-slate-800 pb-1">
                            Explore Capabilities
                        </a>
                    </motion.div>
                </div>

                {/* Dashboard Mockup Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mt-24 w-full max-w-5xl px-4"
                >
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-slate-900 border border-slate-800 rounded-[2rem] aspect-video overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <Shield className="w-10 h-10 text-blue-500" />
                                    </div>
                                    <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Interactive Clinical Dashboard</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <Activity className="w-8 h-8 text-blue-500" />,
                                title: "AI Diagnostics",
                                desc: "Proprietary deep learning models trained on 20,000+ dermatological images for high-precision triage."
                            },
                            {
                                icon: <History className="w-8 h-8 text-emerald-500" />,
                                title: "Historical Tracking",
                                desc: "Securely track lesion changes over time with our encrypted historical database."
                            },
                            {
                                icon: <Lock className="w-8 h-8 text-purple-500" />,
                                title: "Bank-Level Security",
                                desc: "Your medical data is encrypted with AES-256 and authenticated via secure JWT tokens."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/30 transition-all hover:bg-slate-900 shadow-xl"
                            >
                                <div className="bg-slate-800 rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-lg">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 bg-slate-950 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-12 leading-tight">
                        Empowering Healthcare with <br />
                        Professional <span className="text-blue-500">Computer Vision</span>
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                        {[
                            { val: "95%+", label: "Accuracy" },
                            { val: "20k+", label: "Training Images" },
                            { val: "100%", label: "Secure" },
                            { val: "Instant", label: "Results" }
                        ].map((stat, i) => (
                            <div key={i}>
                                <div className="text-3xl font-black text-white">{stat.val}</div>
                                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onGetStarted}
                        className="px-12 py-6 bg-white text-slate-950 rounded-2xl font-black text-2xl hover:bg-slate-200 transition-all shadow-2xl shadow-white/10"
                    >
                        Join the Beta Now
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-slate-900">
                <div className="max-w-6xl mx-auto flex flex-col md:row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-blue-500" />
                        <span className="text-2xl font-black tracking-tighter">DermAI</span>
                    </div>
                    <div className="flex gap-8 text-slate-500 font-medium">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                    <div className="text-slate-600 text-sm">
                        &copy; 2026 DermAI Systems. All Rights Reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
