import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    LogOut, FileType, Eye, CheckCircle, 
    GraduationCap, User, Mail, Phone, CheckCircle2, 
    Sparkles, Activity, Wifi
} from 'lucide-react';

// ✅ IMPORT CHAT WIDGET
import ChatWidget from '../common/ChatWidget';

// ==========================================
// 🎨 PREMIUM COMPONENTS (SHARED)
// ==========================================

// 1. PREMIUM BUTTON
const PremiumButton = ({ onClick, disabled, loading, children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const style = { width: '100%', position: 'relative', padding: '18px', borderRadius: '16px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? '#fed7aa' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: disabled ? '#fff7ed' : 'white', fontWeight: '800', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: isActive ? 'scale(0.96)' : (isHovered && !disabled ? 'translateY(-4px)' : 'translateY(0)'), boxShadow: disabled ? 'none' : (isHovered ? '0 20px 40px -10px rgba(249, 115, 22, 0.5)' : '0 10px 20px -5px rgba(249, 115, 22, 0.2)'), };
    const shineStyle = { position: 'absolute', top: 0, left: isHovered && !disabled ? '200%' : '-100%', width: '50%', height: '100%', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)', transform: 'skewX(-25deg)', transition: 'all 0.75s', };
    return ( <button onClick={onClick} disabled={disabled} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onMouseDown={() => setIsActive(true)} onMouseUp={() => setIsActive(false)} style={style}> <div style={shineStyle} /> <div style={{position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px'}}>{children}</div> </button> );
};

// 2. PREMIUM INPUT
const PremiumInput = ({ icon: Icon, ...props }) => {
    const [focused, setFocused] = useState(false);
    return ( <div style={{position: 'relative', transition: 'transform 0.3s ease', transform: focused ? 'translateY(-2px)' : 'none', width: '100%'}}> <Icon size={18} style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: focused ? '#f97316' : '#94a3b8', transition: 'color 0.3s ease', zIndex: 2, pointerEvents: 'none'}}/> <input {...props} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: focused ? '2px solid #f97316' : '1px solid #e2e8f0', outline: 'none', backgroundColor: focused ? '#ffffff' : '#fff7ed', boxShadow: focused ? '0 10px 25px -5px rgba(249, 115, 22, 0.15)' : 'inset 0 2px 4px 0 rgba(0,0,0,0.01)', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', fontSize: '14px', fontWeight: '600', color: '#431407', boxSizing: 'border-box'}}/> </div> );
};

// 3. PREMIUM SELECT
const PremiumSelect = ({ ...props }) => {
    const [focused, setFocused] = useState(false);
    return ( <select {...props} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{height: '100%', padding: '0 16px', borderRadius: '14px', border: focused ? '2px solid #f97316' : '1px solid #e2e8f0', outline: 'none', backgroundColor: focused ? '#ffffff' : '#fff7ed', fontWeight: '700', color: '#431407', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: focused ? '0 4px 12px rgba(249, 115, 22, 0.1)' : 'none'}}> <option value="+91">+91</option><option value="+1">+1</option><option value="+44">+44</option> </select> );
};

// 4. PREMIUM BANNER
const PremiumBanner = ({ title, subtitle }) => (
    <div style={{ position: 'relative', padding: '40px 50px', background: 'radial-gradient(circle at 100% 0%, #f97316 0%, #ea580c 50%, #7c2d12 100%)', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'rgba(255, 237, 213, 0.2)', borderRadius: '50%', filter: 'blur(80px)'}}></div>
        <div style={{position: 'absolute', bottom: '-20%', left: '10%', width: '300px', height: '300px', background: 'rgba(254, 215, 170, 0.1)', borderRadius: '50%', filter: 'blur(60px)'}}></div>
        <div style={{position: 'relative', zIndex: 10}}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '6px 16px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.3)', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}> <GraduationCap size={14} color="#ffedd5" /> CANDIDATE PORTAL </div>
            <h2 style={{fontSize: '36px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px', textShadow: '0 4px 12px rgba(0,0,0,0.3)'}}> {title} </h2>
            <p style={{color: '#ffedd5', fontSize: '16px', fontWeight: '500', maxWidth: '500px', lineHeight: '1.5'}}> {subtitle} </p>
        </div>
    </div>
);

// 5. MAGIC UPLOAD BOX
const MagicUploadBox = ({ hasFile, icon: Icon, label, onView, ...props }) => {
    const [isHovered, setIsHovered] = useState(false);
    const boxStyle = { flex: 1, position: 'relative', height: '160px', borderRadius: '20px', border: hasFile ? '2px solid #f97316' : (isHovered ? '2px dashed #f97316' : '2px dashed #fed7aa'), background: hasFile ? '#fff7ed' : (isHovered ? '#fffaf0' : '#ffffff'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', transform: isHovered && !hasFile ? 'translateY(-4px)' : 'none', boxShadow: isHovered ? '0 10px 25px -5px rgba(249, 115, 22, 0.1)' : 'none' };
    return ( <label style={boxStyle} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}> <input type="file" style={{display:'none'}} {...props} /> <div style={{ transition: 'all 0.3s ease', transform: isHovered ? 'scale(1.1)' : 'scale(1)', marginBottom: '12px', padding: '16px', background: hasFile ? 'white' : (isHovered ? '#fff7ed' : '#fff'), borderRadius: '50%', boxShadow: hasFile ? '0 4px 12px rgba(249, 115, 22, 0.1)' : '0 4px 12px rgba(0,0,0,0.05)' }}> {hasFile ? <CheckCircle2 size={32} color="#ea580c"/> : <Icon size={32} color={isHovered ? "#f97316" : "#cbd5e1"}/>} </div> <div style={{textAlign: 'center', zIndex: 2}}> <div style={{fontSize:'14px', fontWeight:'700', color: hasFile ? '#431407' : '#9a3412', transition: 'color 0.2s'}}> {hasFile ? "File Ready" : label} </div> {!hasFile && ( <div style={{fontSize:'11px', color:'#c2410c', marginTop:'4px', fontWeight:'500', opacity: 0.7}}> {isHovered ? "Click to browse" : "JPG, PNG (Max 5MB)"} </div> )} </div> {hasFile && ( <button onClick={(e) => { e.preventDefault(); onView(); }} style={{ marginTop: '12px', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(249, 115, 22, 0.2)', background: 'white', color: '#ea580c', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}> <Eye size={12}/> View File </button> )} </label> );
};

// 6. HUD HEADER
const HUDHeader = ({ studentName, onLogout }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '15px 30px', margin: '20px 20px 0 0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.5)', position: 'sticky', top: '20px', zIndex: 50 }}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}> <h1 style={{fontSize:'22px', fontWeight:'900', color:'#431407', letterSpacing:'-0.5px'}}> Student Dashboard </h1> <div style={{height:'24px', width:'1px', background:'#fed7aa'}}></div> <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#c2410c', fontSize:'11px', fontWeight:'700', background:'#ffedd5', padding:'4px 10px', borderRadius:'20px'}}> <Wifi size={12}/> SYSTEM SECURE </div> </div>
        <div style={{display:'flex', alignItems:'center', gap:'20px'}}> <div style={{display:'flex', alignItems:'center', gap:'10px'}}> <div style={{textAlign:'right'}}> <div style={{fontSize:'14px', fontWeight:'800', color:'#431407', textTransform:'uppercase'}}>{studentName || "Student"}</div> <div style={{fontSize:'10px', color:'#9a3412', fontWeight:'600'}}>APPLICANT</div> </div> <div style={{width:'40px', height:'40px', background:'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', boxShadow:'0 4px 12px rgba(249, 115, 22, 0.3)'}}> <User size={20}/> </div> </div> <div style={{height:'24px', width:'1px', background:'#fed7aa'}}></div> <button onClick={onLogout} style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fef2f2', color:'#ef4444', border:'none', padding:'10px 16px', borderRadius:'12px', fontSize:'13px', fontWeight:'700', cursor:'pointer', transition:'all 0.2s' }}> <LogOut size={16}/> LOGOUT </button> </div>
    </div>
);

// ==========================================
// 🚀 MAIN DASHBOARD COMPONENT
// ==========================================
const StudentDashboard = ({ studentName }) => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [level, setLevel] = useState('12');
  const [file12, setFile12] = useState(null);
  const [file10, setFile10] = useState(null);
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [status, setStatus] = useState('idle'); 

  // --- HANDLERS ---
  const handleFileChange = (e, targetLevel) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (targetLevel === '10') setFile10(selectedFile);
      else setFile12(selectedFile);
      setStatus('idle');
    }
  };
  const handleViewFile = (file) => { if (file) window.open(URL.createObjectURL(file), '_blank'); };
  
  const handleUpload = async () => {
    const has12 = (level === '12' || level === 'BOTH') ? !!file12 : true;
    const has10 = (level === '10' || level === 'BOTH') ? !!file10 : true;
    
    if (!has12 || !has10 || !email || !phoneNumber || !isChecked) { 
        alert("Error: Please complete all fields and upload the required certificate(s)."); 
        return; 
    }
    
    setStatus('uploading');
    
    const sendRequest = async (lvl, fileObj) => {
      const formData = new FormData();
      formData.append('name', studentName); 
      formData.append('email', email);
      formData.append('phone', `${countryCode} ${phoneNumber}`); 
      formData.append('level', lvl); 
      formData.append('image', fileObj);
      return axios.post('http://localhost:5000/api/student/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    };
    
    try {
      if (level === 'BOTH') { 
          await Promise.all([sendRequest('12', file12), sendRequest('10', file10)]); 
      } else { 
          await sendRequest(level, level === '12' ? file12 : file10); 
      }
      setStatus('success'); 
      alert("✅ Request Submitted Successfully!");
    } catch (err) { 
        console.error(err); 
        setStatus('error'); 
        alert("❌ Upload Failed. Please check the backend connection."); 
    }
  };
  
  const isBioDataFilled = email && phoneNumber && (file12 || file10);
  const handleLogout = () => navigate('/');

  // --- STYLES ---
  const colors = { bg: '#fff7ed' };
  const styles = {
    layout: { display: 'flex', height: '100vh', backgroundColor: colors.bg, fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
    mainContentWrapper: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    scrollableArea: { flex: 1, overflowY: 'auto', padding: '30px 20px 40px 20px' }, // Added padding left since sidebar is gone
    container: { width: '100%', maxWidth: '900px', margin: '0 auto', boxSizing: 'border-box' },
    panel: { backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #fed7aa' },
    panelBody: { padding: '40px', backgroundColor: 'white' },
    inputGrid: { width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
    dualGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    singleGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '20px' },
    declarationBox: { background: '#fffaf0', border: '1px solid #fed7aa', padding: '20px', borderRadius: '12px', marginBottom: '20px' },
    legalText: { fontSize: '13px', color: '#9a3412', marginBottom: '8px', display:'flex', alignItems:'center', gap:'8px' },
  };

  return (
    <div style={styles.layout}>
      {/* CONTENT AREA (Full Width) */}
      <div style={styles.mainContentWrapper}>
        <HUDHeader studentName={studentName} onLogout={handleLogout} />
        
        <div style={styles.scrollableArea}>
          <div style={styles.container}>
            <div style={styles.panel}>
              
              <PremiumBanner 
                  title="Secure Submission" 
                  subtitle="Upload your academic credentials for instant AI-powered verification."
              />
              
              <div style={styles.panelBody}>
                 
                 <div className="animate-fade-in">
                    {/* CANDIDATE DETAILS */}
                    <div style={{marginBottom:'30px'}}>
                        <h3 style={{fontSize:'12px', fontWeight:'800', color:'#ea580c', letterSpacing:'1px', marginBottom:'15px'}}>CANDIDATE DETAILS</h3>
                        <div style={styles.inputGrid}>
                            <PremiumInput icon={User} type="text" value={studentName} readOnly style={{background:'#fff7ed'}} />
                            <PremiumInput icon={Mail} type="email" placeholder="Official Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div style={{display:'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px'}}>
                            <div style={{height:'54px'}}><PremiumSelect value={countryCode} onChange={(e) => setCountryCode(e.target.value)} /></div>
                            <PremiumInput icon={Phone} type="number" placeholder="Contact Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                        </div>
                    </div>

                    {/* DOCUMENT UPLOAD */}
                    <div style={{marginBottom:'30px'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                            <h3 style={{fontSize:'12px', fontWeight:'800', color:'#ea580c', letterSpacing:'1px'}}>DOCUMENT UPLOAD</h3>
                            <div style={{width:'200px', height:'40px'}}>
                                <select style={{width:'100%', height:'100%', borderRadius:'12px', border:'1px solid #fed7aa', padding:'0 10px', fontWeight:'700', color:'#431407', background:'#fff7ed'}} value={level} onChange={(e) => { setLevel(e.target.value); setFile12(null); setFile10(null); }}>
                                    <option value="12">Class 12 Only</option><option value="10">Class 10 Only</option><option value="BOTH">Both (10th & 12th)</option>
                                </select>
                            </div>
                        </div>
                        <div style={level === 'BOTH' ? styles.dualGrid : styles.singleGrid}>
                            {(level === '12' || level === 'BOTH') && ( <MagicUploadBox label="Class 12 Marksheet" hasFile={!!file12} icon={FileType} onChange={(e) => handleFileChange(e, '12')} onView={() => handleViewFile(file12)} /> )}
                            {(level === '10' || level === 'BOTH') && ( <MagicUploadBox label="Class 10 Marksheet" hasFile={!!file10} icon={FileType} onChange={(e) => handleFileChange(e, '10')} onView={() => handleViewFile(file10)} /> )}
                        </div>
                    </div>

                    {/* DECLARATION & SUBMIT */}
                    {isBioDataFilled && (
                        <div className="animate-fade-in">
                            <div style={styles.declarationBox}>
                                <p style={styles.legalText}><CheckCircle2 size={14}/> I hereby declare that the information provided above is true.</p>
                                <p style={styles.legalText}><CheckCircle2 size={14}/> I authorize DIVA Systems to use AI-based analysis for verification.</p>
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', cursor:'pointer'}} onClick={() => setIsChecked(!isChecked)}>
                                <div style={{width:'20px', height:'20px', borderRadius:'6px', border:'2px solid #f97316', display:'flex', alignItems:'center', justifyContent:'center', background: isChecked ? '#f97316' : 'white'}}>
                                    {isChecked && <CheckCircle2 size={14} color="white"/>}
                                </div>
                                <span style={{fontSize:'14px', fontWeight:'600', color:'#431407'}}>I confirm the authenticity of these documents.</span>
                            </div>
                            {status === 'success' ? (
                                <div style={{background:'#dcfce7', color:'#15803d', padding:'15px', borderRadius:'12px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px', justifyContent:'center'}}>
                                    <CheckCircle size={20}/> Submission Received Successfully!
                                </div>
                            ) : (
                                <PremiumButton onClick={handleUpload} disabled={status === 'uploading' || !isChecked} loading={status === 'uploading'}>
                                    {status === 'uploading' ? <Activity className="animate-spin" size={18}/> : <Sparkles size={18}/>} 
                                    {status === 'uploading' ? 'TRANSMITTING DATA...' : 'FINAL SUBMISSION'}
                                </PremiumButton>
                            )}
                        </div>
                    )}
                 </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ChatWidget userType="student" userName={studentName} />
    </div>
  );
};

export default StudentDashboard;