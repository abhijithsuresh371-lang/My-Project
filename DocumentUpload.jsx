import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { 
    FileText, User, ShieldAlert, Activity,  
    FileImage, FileType, Mail, Phone, Save, 
    Inbox, LayoutDashboard, ChevronRight, Clock, Trash2, CheckCircle2, 
    ShieldCheck, Sparkles, Eye, ClipboardList, LogOut, Wifi} from 'lucide-react';
import OCRResults from './OCRResults';
import AdminHistoryTable from './AdminHistoryTable';

// Centralized API Config
const API_BASE = 'http://localhost:5000/api';

// --- 1. PREMIUM BUTTON (Preserved) ---
const PremiumButton = ({ onClick, disabled, loading, children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const style = { width: '100%', position: 'relative', padding: '18px', borderRadius: '16px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? '#e2e8f0' : 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)', color: disabled ? '#94a3b8' : 'white', fontWeight: '800', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: isActive ? 'scale(0.96)' : (isHovered && !disabled ? 'translateY(-4px)' : 'translateY(0)'), boxShadow: disabled ? 'none' : (isHovered ? '0 20px 40px -10px rgba(67, 56, 202, 0.5)' : '0 10px 20px -5px rgba(67, 56, 202, 0.2)'), };
    const shineStyle = { position: 'absolute', top: 0, left: isHovered && !disabled ? '200%' : '-100%', width: '50%', height: '100%', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)', transform: 'skewX(-25deg)', transition: 'all 0.75s', };
    return ( <button onClick={onClick} disabled={disabled} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onMouseDown={() => setIsActive(true)} onMouseUp={() => setIsActive(false)} style={style}> <div style={shineStyle} /> <div style={{position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px'}}>{children}</div> </button> );
};

// --- 2. PREMIUM INPUT (Preserved) ---
const PremiumInput = ({ icon: Icon, ...props }) => {
    const [focused, setFocused] = useState(false);
    return ( <div style={{position: 'relative', transition: 'transform 0.3s ease', transform: focused ? 'translateY(-2px)' : 'none', width: '100%'}}> <Icon size={18} style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: focused ? '#4338ca' : '#94a3b8', transition: 'color 0.3s ease', zIndex: 2, pointerEvents: 'none'}}/> <input {...props} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: focused ? '2px solid #4338ca' : '1px solid #e2e8f0', outline: 'none', backgroundColor: focused ? '#ffffff' : '#f8fafc', boxShadow: focused ? '0 10px 25px -5px rgba(67, 56, 202, 0.15)' : 'inset 0 2px 4px 0 rgba(0,0,0,0.01)', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', fontSize: '14px', fontWeight: '600', color: '#1e293b', boxSizing: 'border-box'}}/> </div> );
};

// --- 3. PREMIUM SELECT (Preserved) ---
const PremiumSelect = ({ ...props }) => {
    const [focused, setFocused] = useState(false);
    return ( <select {...props} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{height: '100%', padding: '0 16px', borderRadius: '14px', border: focused ? '2px solid #4338ca' : '1px solid #e2e8f0', outline: 'none', backgroundColor: focused ? '#ffffff' : '#f8fafc', fontWeight: '700', color: '#1e293b', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: focused ? '0 4px 12px rgba(67, 56, 202, 0.1)' : 'none'}}> <option value="+91">+91</option><option value="+1">+1</option><option value="+44">+44</option> </select> );
};

// --- 4. PREMIUM BANNER (Preserved) ---
const PremiumBanner = () => (
    <div style={{ position: 'relative', padding: '40px 50px', background: 'radial-gradient(circle at 100% 0%, #4338ca 0%, #312e81 50%, #1e1b4b 100%)', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '50%', filter: 'blur(80px)'}}></div>
        <div style={{position: 'absolute', bottom: '-20%', left: '10%', width: '300px', height: '300px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '50%', filter: 'blur(60px)'}}></div>
        <div style={{position: 'relative', zIndex: 10}}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '6px 16px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}> <ShieldCheck size={14} color="#a5b4fc" /> OFFICIAL CONSOLE </div>
            <h2 style={{fontSize: '36px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px', textShadow: '0 4px 12px rgba(0,0,0,0.3)'}}> Verification Console </h2>
            <p style={{color: '#c7d2fe', fontSize: '16px', fontWeight: '500', maxWidth: '500px', lineHeight: '1.5'}}> Advanced cross-reference analysis for academic credentials using Optical Character Recognition (OCR). </p>
        </div>
    </div>
);

// --- 5. MAGIC UPLOAD BOX (Preserved with Type Checks) ---
const MagicUploadBox = ({ hasFile, icon: Icon, label, onView, acceptType, ...props }) => {
    const [isHovered, setIsHovered] = useState(false);
    const boxStyle = { flex: 1, position: 'relative', height: '160px', borderRadius: '20px', border: hasFile ? '2px solid #4338ca' : (isHovered ? '2px dashed #4338ca' : '2px dashed #cbd5e1'), background: hasFile ? '#eef2ff' : (isHovered ? '#fafafa' : '#ffffff'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', transform: isHovered && !hasFile ? 'translateY(-4px)' : 'none', boxShadow: isHovered ? '0 10px 25px -5px rgba(0,0,0,0.05)' : 'none' };
    
    const helperText = acceptType === 'application/pdf' ? "PDF Only (Max 5MB)" : "JPG, PNG Only (Max 5MB)";

    return ( 
        <label style={boxStyle} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}> 
            <input type="file" style={{display:'none'}} accept={acceptType} {...props} /> 
            <div style={{ transition: 'all 0.3s ease', transform: isHovered ? 'scale(1.1)' : 'scale(1)', marginBottom: '12px', padding: '16px', background: hasFile ? 'white' : (isHovered ? '#eef2ff' : '#f1f5f9'), borderRadius: '50%', boxShadow: hasFile ? '0 4px 12px rgba(67, 56, 202, 0.1)' : 'none' }}> 
                {hasFile ? <CheckCircle2 size={32} color="#16a34a"/> : <Icon size={32} color={isHovered ? "#4338ca" : "#94a3b8"}/>} 
            </div> 
            <div style={{textAlign: 'center', zIndex: 2}}> 
                <div style={{fontSize:'14px', fontWeight:'700', color: hasFile ? '#1e293b' : '#64748b', transition: 'color 0.2s'}}> {hasFile ? "File Uploaded" : label} </div> 
                {!hasFile && ( <div style={{fontSize:'11px', color:'#94a3b8', marginTop:'4px', fontWeight:'500'}}> {isHovered ? "Click to browse" : helperText} </div> )} 
            </div> 
            {hasFile && ( <button onClick={(e) => { e.preventDefault(); onView(); }} style={{ marginTop: '12px', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(67, 56, 202, 0.2)', background: 'white', color: '#4338ca', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}> <Eye size={12}/> View File </button> )} 
        </label> 
    );
};

// --- 6. HUD HEADER (Preserved) ---
const HUDHeader = ({ title, onLogout }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '15px 30px', margin: '20px 20px 0 0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.5)', position: 'sticky', top: '20px', zIndex: 50 }}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <h1 style={{fontSize:'22px', fontWeight:'900', color:'#1e1b4b', letterSpacing:'-0.5px'}}>{title}</h1>
                <div style={{height:'24px', width:'1px', background:'#cbd5e1'}}></div>
                <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#16a34a', fontSize:'11px', fontWeight:'700', background:'#dcfce7', padding:'4px 10px', borderRadius:'20px'}}> <Wifi size={12}/> SYSTEM ONLINE </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{textAlign:'right'}}> <div style={{fontSize:'14px', fontWeight:'800', color:'#1e1b4b'}}>ADMINISTRATOR</div> <div style={{fontSize:'10px', color:'#64748b', fontWeight:'600'}}>ID: #DIVA-8821</div> </div>
                    <div style={{width:'40px', height:'40px', background:'linear-gradient(135deg, #4338ca 0%, #312e81 100%)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', boxShadow:'0 4px 12px rgba(67, 56, 202, 0.3)'}}> <User size={20}/> </div>
                </div>
                <div style={{height:'24px', width:'1px', background:'#cbd5e1'}}></div>
                <button onClick={onLogout} style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fef2f2', color:'#ef4444', border:'none', padding:'10px 16px', borderRadius:'12px', fontSize:'13px', fontWeight:'700', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'} onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}> <LogOut size={16}/> LOGOUT </button>
            </div>
        </div>
    );
};

const DocumentUpload = () => {
    // --- STATE ---
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('scanner'); 
    const [requests, setRequests] = useState([]);
    const [uploadMode, setUploadMode] = useState('BOTH'); 
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

    // Scanner Data
    const [candidateName, setCandidateName] = useState("");
    const [candidateEmail, setCandidateEmail] = useState("");
    const [candidatePhone, setCandidatePhone] = useState("");
    const [countryCode, setCountryCode] = useState("+91");

    const [files, setFiles] = useState({ 
        '12th': { pdf: null, img: null, pdfPrev: null, imgPrev: null }, 
        '10th': { pdf: null, img: null, pdfPrev: null, imgPrev: null } 
    });
    const [results, setResults] = useState({ '12th': null, '10th': null });
    const [loading, setLoading] = useState({ '12th': false, '10th': false });
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    // ✅ REF-BASED CLEANUP (Fixes ESLint Warning)
    const fileRefs = useRef(files); 
    fileRefs.current = files; // Keep ref updated

    useEffect(() => {
        return () => {
            // Cleanup strictly on unmount
            ['12th', '10th'].forEach(level => {
                const currentFiles = fileRefs.current[level];
                if (currentFiles.pdfPrev) URL.revokeObjectURL(currentFiles.pdfPrev);
                if (currentFiles.imgPrev) URL.revokeObjectURL(currentFiles.imgPrev);
            });
        };
    }, []);

    // --- FETCH DATA ---
    const fetchRequests = useCallback(async () => {
        try { 
            const res = await axios.get(`${API_BASE}/admin/requests`); 
            setRequests(res.data); 
        } catch (err) { 
            console.error("Fetch error:", err); 
        }
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests, activeTab]);

    // --- HANDLERS ---
    const handleLogout = () => {
        if(window.confirm("Are you sure you want to logout?")) {
            navigate('/'); 
        }
    };

    const handleCheckRequest = async (req) => {
        setActiveTab('scanner'); 
        setResults({ '12th': null, '10th': null }); 
        setSaveStatus(null);
        setCandidateName(req.candidate_name); 
        setCandidateEmail(req.email);
        
        const phoneSplit = req.phone.split(" "); 
        setCandidatePhone(phoneSplit.length > 1 ? phoneSplit[1] : req.phone);
        setUploadMode(req.level === '10' ? '10th' : (req.level === '12' ? '12th' : 'BOTH'));
        
        try {
            const imageUrl = `${API_BASE.replace('/api', '')}/api/uploads/requests/${req.image_path}`;
            const response = await fetch(imageUrl);
            
            if (!response.ok) throw new Error("Image fetch failed");
            
            const blob = await response.blob();
            const file = new File([blob], req.image_path, { type: blob.type });
            const typeKey = req.level === '10' ? '10th' : '12th';
            
            if (files[typeKey].imgPrev) URL.revokeObjectURL(files[typeKey].imgPrev);

            setFiles(prev => ({ 
                ...prev, 
                [typeKey]: { 
                    ...prev[typeKey], 
                    img: file, 
                    imgPrev: URL.createObjectURL(file) 
                } 
            }));
        } catch (e) { 
            console.error("Load failed:", e);
            alert("Could not load candidate image from server.");
        }
    };

    const handleClearRequest = async (id) => { 
        if (!window.confirm("Remove this request from the queue?")) return; 
        try { 
            await axios.post(`${API_BASE}/admin/requests/clear/${id}`); 
            fetchRequests(); 
        } catch (err) { 
            alert("Clear failed."); 
        } 
    };
    
    // File Handler with Strict Type Validation
    const handleFileChange = (e, type, format) => { 
        const file = e.target.files[0]; 
        if (file) { 
            if (format === 'pdf' && file.type !== "application/pdf") {
                alert("❌ INVALID FILE: Please upload a PDF document.");
                e.target.value = ""; 
                return;
            }
            if (format === 'img' && !file.type.startsWith("image/")) {
                alert("❌ INVALID FILE: Please upload an Image (JPG/PNG).");
                e.target.value = ""; 
                return;
            }

            const prevUrlKey = format === 'pdf' ? 'pdfPrev' : 'imgPrev';
            if (files[type][prevUrlKey]) URL.revokeObjectURL(files[type][prevUrlKey]);

            setFiles(prev => ({ 
                ...prev, 
                [type]: { 
                    ...prev[type], 
                    [format]: file, 
                    [prevUrlKey]: URL.createObjectURL(file) 
                } 
            })); 
            setResults(prev => ({ ...prev, [type]: null })); 
        } 
    };

    const handleViewFile = (previewUrl) => { if (previewUrl) window.open(previewUrl, '_blank'); };

    const handleVerify = async (type) => {
        if (!candidateName || !candidateEmail || !candidatePhone) return alert("Enter candidate details.");
        if (!files[type].pdf || !files[type].img) return alert(`Upload both files for ${type}.`);
        
        setLoading(prev => ({ ...prev, [type]: true }));
        
        const formData = new FormData();
        formData.append('original_pdf', files[type].pdf); 
        formData.append('scanned_image', files[type].img);
        formData.append('candidate_name', candidateName); 
        formData.append('candidate_email', candidateEmail);
        formData.append('candidate_phone', `${countryCode}${candidatePhone}`); 
        formData.append('level', type === '12th' ? "12" : "10");
        
        try { 
            const res = await axios.post(`${API_BASE}/admin/verify`, formData); 
            setResults(prev => ({ ...prev, [type]: res.data })); 
        } catch (err) { 
            alert("Verification Failed. Check Console."); 
            console.log(err); 
        }
        setLoading(prev => ({ ...prev, [type]: false }));
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const fullPhone = `${countryCode}${candidatePhone}`;
            const createPayload = (resultData) => ({ 
                ...resultData.extracted_data, 
                verification_report: resultData.verification_report, 
                extracted_data: resultData.extracted_data, 
                email: candidateEmail, 
                phone: fullPhone, 
                details: { 
                    ...resultData.extracted_data.details, 
                    result_status: resultData.verification_report.final_verdict 
                } 
            });

            const promises = [];
            if (results['12th']) promises.push(axios.post(`${API_BASE}/db/save`, createPayload(results['12th'])));
            if (results['10th']) promises.push(axios.post(`${API_BASE}/db/save`, createPayload(results['10th'])));

            if (promises.length === 0) return alert("No results to save.");

            await Promise.all(promises);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
            
        } catch (error) { 
            console.error(error);
            alert("Save Failed"); 
        }
        setSaving(false);
    };

    // --- STYLES (Preserved) ---
    const colors = { sidebarBg: '#1e1b4b', activeItem: '#3730a3', accent: '#4338ca', bg: '#f8fafc', border: '#e2e8f0' };
    const styles = {
        layout: { display: 'flex', height: '100vh', backgroundColor: colors.bg, fontFamily: "'Inter', sans-serif", overflow: 'hidden' }, 
        sidebar: { width: isSidebarHovered ? '260px' : '80px', backgroundColor: colors.sidebarBg, color: 'white', display: 'flex', flexDirection: 'column', margin: '20px', height: 'calc(100% - 40px)', borderRadius: '30px', padding: '30px 15px', flexShrink: 0, transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 100 },
        sidebarTitleWrapper: { height: '40px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: isSidebarHovered ? 'flex-start' : 'center', paddingLeft: isSidebarHovered ? '10px' : '0', overflow: 'hidden', whiteSpace: 'nowrap' },
        sidebarTitle: { fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px', opacity: isSidebarHovered ? 1 : 0, transition: 'opacity 0.2s ease', marginLeft: '10px' },
        navItem: (active) => ({ display: 'flex', alignItems: 'center', justifyContent: isSidebarHovered ? 'flex-start' : 'center', gap: '14px', padding: '14px', borderRadius: '16px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', backgroundColor: active ? colors.activeItem : 'transparent', color: active ? 'white' : '#94a3b8', transition: 'all 0.2s', boxShadow: active ? '0 4px 12px rgba(0,0,0,0.2)' : 'none', whiteSpace: 'nowrap', overflow: 'hidden' }),
        navText: { opacity: isSidebarHovered ? 1 : 0, width: isSidebarHovered ? 'auto' : 0, transition: 'opacity 0.2s ease', pointerEvents: isSidebarHovered ? 'auto' : 'none' },
        badge: { backgroundColor: '#f43f5e', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold', position: isSidebarHovered ? 'relative' : 'absolute', top: isSidebarHovered ? 'auto' : '10px', right: isSidebarHovered ? 'auto' : '10px', marginLeft: 'auto' },
        mainContentWrapper: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }, 
        scrollableArea: { flex: 1, overflowY: 'auto', padding: '30px 20px 40px 0' }, 
        container: { width: '100%', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' },
        panel: { backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${colors.border}` },
        panelBody: { padding: '40px', backgroundColor: 'white' },
        inputGrid: { width: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1.5fr', gap: '20px', marginBottom: '40px' },
        cardGrid: { width: '100%', display: 'grid', gridTemplateColumns: uploadMode === 'BOTH' ? '1fr 1fr' : '1fr', gap: '30px' },
        card: { backgroundColor: 'white', borderRadius: '24px', padding: '30px', border: `1px solid ${colors.border}`, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' },
        cardHeader: { fontSize: '18px', fontWeight: '800', color: colors.sidebarBg, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' },
        uploadContainer: { display: 'flex', gap: '20px', marginBottom: '25px' },
        saveBtn: { width: '100%', maxWidth: '500px', margin: '50px auto 0', padding: '18px', borderRadius: '14px', border: 'none', cursor: 'pointer', backgroundColor: saveStatus === 'success' ? '#16a34a' : colors.sidebarBg, color: 'white', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)' },
        tableContainer: { backgroundColor: 'white', borderRadius: '20px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', width: '100%' },
        th: { padding: '20px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', backgroundColor: '#f8fafc' },
        td: { padding: '20px', borderTop: `1px solid ${colors.border}`, fontSize: '14px', color: '#334155', fontWeight: '500' },
        checkBtn: { backgroundColor: colors.accent, color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }
    };

    return (
        <div style={styles.layout}>
            {/* 1. LEFT SIDEBAR */}
            <div style={styles.sidebar} onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)}>
                <div style={styles.sidebarTitleWrapper}><ShieldAlert size={isSidebarHovered ? 24 : 28} color="white" /><span style={styles.sidebarTitle}>DIVA Admin</span></div>
                <div onClick={() => setActiveTab('scanner')} style={styles.navItem(activeTab === 'scanner')}><LayoutDashboard size={20} /> <span style={styles.navText}>Scanner Console</span></div>
                <div onClick={() => setActiveTab('inbox')} style={styles.navItem(activeTab === 'inbox')}>
                    <div style={{position: 'relative'}}><Inbox size={20} /> {!isSidebarHovered && requests.length > 0 && <div style={{position:'absolute', top:-2, right:-2, width:8, height:8, background:'#f43f5e', borderRadius:'50%'}}></div>}</div>
                    <span style={styles.navText}>Request Inbox</span> {isSidebarHovered && requests.length > 0 && <span style={styles.badge}>{requests.length}</span>}
                </div>
                <div onClick={() => setActiveTab('history')} style={styles.navItem(activeTab === 'history')}>
                    <ClipboardList size={20} /> <span style={styles.navText}>History Log</span>
                </div>
            </div>

            {/* 2. RIGHT COLUMN (Header + Content) */}
            <div style={styles.mainContentWrapper}>
                <HUDHeader 
                    title={activeTab === 'scanner' ? 'Scanner Console' : (activeTab === 'inbox' ? 'Request Inbox' : 'Verification History')}
                    onLogout={handleLogout}
                />
                <div style={styles.scrollableArea}>
                    <div style={styles.container}>
                        {activeTab === 'inbox' && (
                            <div>
                                <div style={styles.tableContainer}>
                                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                                        <thead><tr><th style={styles.th}>Candidate</th><th style={styles.th}>Email</th><th style={styles.th}>Level</th><th style={styles.th}>Received At</th><th style={{...styles.th, textAlign: 'center'}}>Actions</th></tr></thead>
                                        <tbody>
                                            {requests.map(req => (
                                                <tr key={req.id}>
                                                    <td style={styles.td}><strong>{req.candidate_name}</strong></td>
                                                    <td style={styles.td}>{req.email}</td>
                                                    <td style={styles.td}><span style={{background:'#e0e7ff', color:'#4338ca', padding:'4px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:'700'}}>Class {req.level}</span></td>
                                                    <td style={styles.td}><div style={{display:'flex', alignItems:'center', gap:'6px', color:'#64748b'}}><Clock size={14}/> {new Date(req.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:true})}</div></td>
                                                    <td style={{...styles.td, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px'}}>
                                                        <button onClick={() => handleCheckRequest(req)} style={styles.checkBtn}>CHECK <ChevronRight size={14}/></button>
                                                        <button onClick={() => handleClearRequest(req.id)} style={{padding: '8px', border: '1px solid #fee2e2', background: '#fff1f2', borderRadius: '8px', color: '#ef4444', cursor: 'pointer'}}><Trash2 size={16}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'scanner' && (
                            <div style={styles.panel}>
                                <PremiumBanner />
                                <div style={styles.panelBody}>
                                    <div style={styles.inputGrid}>
                                        <PremiumInput icon={User} type="text" placeholder="Candidate Name" value={candidateName} onChange={e => setCandidateName(e.target.value)} />
                                        <PremiumInput icon={Mail} type="email" placeholder="Email Address" value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)} />
                                        <div style={{display:'flex', gap:'12px'}}>
                                            <div style={{width: '90px'}}><PremiumSelect value={countryCode} onChange={e => setCountryCode(e.target.value)} /></div>
                                            <div style={{flex: 1}}><PremiumInput icon={Phone} type="number" placeholder="Mobile" value={candidatePhone} onChange={e => setCandidatePhone(e.target.value)} /></div>
                                        </div>
                                    </div>
                                    <div style={styles.cardGrid}>
                                        {(uploadMode === '12th' || uploadMode === 'BOTH') && (
                                            <ScannerCard lvl="12th" files={files} handleFileChange={handleFileChange} styles={styles} handleViewFile={handleViewFile} handleVerify={handleVerify} loading={loading} results={results} candidateEmail={candidateEmail} countryCode={countryCode} candidatePhone={candidatePhone} />
                                        )}
                                        {(uploadMode === '10th' || uploadMode === 'BOTH') && (
                                            <ScannerCard lvl="10th" files={files} handleFileChange={handleFileChange} styles={styles} handleViewFile={handleViewFile} handleVerify={handleVerify} loading={loading} results={results} candidateEmail={candidateEmail} countryCode={countryCode} candidatePhone={candidatePhone} />
                                        )}
                                    </div>
                                    {(results['12th'] || results['10th']) && 
                                        <div style={{textAlign: 'center'}}>
                                            <button onClick={handleSaveAll} disabled={saving} style={styles.saveBtn}>{saving ? <Activity className="animate-spin"/> : saveStatus === 'success' ? <CheckCircle2/> : <Save/>} {saveStatus === 'success' ? "SAVED SUCCESSFULLY" : "SAVE CANDIDATE TO DATABASE"}</button>
                                        </div>
                                    }
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'history' && (
                            <div className="animate-fade-in">
                                <AdminHistoryTable />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SCANNER CARD COMPONENT (FIXED: DUPLICATE ALERT REMOVED) ---
const ScannerCard = ({ lvl, files, handleFileChange, styles, handleViewFile, handleVerify, loading, results, candidateEmail, countryCode, candidatePhone }) => {
    return (
    <div style={styles.card}>
        <div style={styles.cardHeader}><FileText size={22} color="#4338ca"/> {lvl} Grade</div>
        <div style={styles.uploadContainer}>
            <MagicUploadBox 
                label="Original PDF" 
                hasFile={!!files[lvl].pdf} 
                icon={FileType} 
                acceptType="application/pdf"
                onChange={(e) => handleFileChange(e, lvl, 'pdf')} 
                onView={() => handleViewFile(files[lvl].pdfPrev)} 
            />
            <MagicUploadBox 
                label="Student Scan" 
                hasFile={!!files[lvl].img} 
                icon={FileImage} 
                acceptType="image/png, image/jpeg, image/jpg"
                onChange={(e) => handleFileChange(e, lvl, 'img')} 
                onView={() => handleViewFile(files[lvl].imgPrev)} 
            />
        </div>
        
        <PremiumButton onClick={() => handleVerify(lvl)} disabled={loading[lvl]} loading={loading[lvl]}>
            {loading[lvl] ? <Activity className="animate-spin" size={18}/> : <Sparkles size={18}/>} 
            {loading[lvl] ? "ANALYZING DOCS..." : "VERIFY DOCUMENT"}
        </PremiumButton>

        {/* ✅ FIX: Manual 'hasDiscrepancies' check is REMOVED. 
            The report below (OCRResults) handles the red alert internally. */}

        {results[lvl] && (
            <div style={{marginTop:'25px'}}>
                <OCRResults 
                    report={results[lvl]} 
                    expectedType={lvl} 
                    hideSaveButton={true} 
                    candidateEmail={candidateEmail} 
                    candidatePhone={`${countryCode}${candidatePhone}`}
                />
            </div>
        )}
    </div>
    );
};

export default DocumentUpload;