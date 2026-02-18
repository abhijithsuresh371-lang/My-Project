import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OCRResults from './OCRResults'; // ✅ We reuse your existing component!
import { 
  Calendar, Search, FileCheck, FileX, ChevronRight, 
  BookOpen, Trash2, X, Loader2, Mail, Phone 
} from 'lucide-react';

const AdminHistoryTable = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- MODAL STATE ---
  const [selectedStudent, setSelectedStudent] = useState(null); // Stores ID of clicked student
  const [detailData, setDetailData] = useState(null); // Stores the full JSON from backend
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/history');
      setRecords(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
    setLoading(false);
  };

  const handleClearHistory = async () => {
    if (!window.confirm("⚠️ ARE YOU SURE? This deletes ALL data.")) return;
    try {
      await axios.delete('http://localhost:5000/api/admin/history/clear');
      setRecords([]);
    } catch (error) { console.error(error); }
  };

  // --- NEW: FETCH DETAILS ON CLICK ---
  const handleRowClick = async (admno) => {
    setSelectedStudent(admno);
    setLoadingDetails(true);
    setDetailData(null);
    try {
      // Fetch the full JSON blobs for this student
      const response = await axios.get(`http://localhost:5000/api/admin/history/${admno}`);
      setDetailData(response.data);
    } catch (error) {
      console.error("Fetch details error:", error);
    }
    setLoadingDetails(false);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setDetailData(null);
  };

  useEffect(() => { fetchHistory(); }, []);

  const filteredRecords = records.filter(record => 
    record.name && record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- STYLES ---
  const styles = {
    container: { padding: '30px', animation: 'fadeIn 0.4s ease' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    title: { fontSize: '24px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' },
    searchBox: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 15px', width: '300px' },
    searchInput: { border: 'none', outline: 'none', marginLeft: '10px', width: '100%', fontSize: '14px' },
    clearBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' },
    tableWrapper: { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '16px', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
    tr: { cursor: 'pointer', transition: 'background 0.2s' },
    td: { padding: '16px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '14px', fontWeight: '500' },
    statusBadge: (status) => ({ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: status === 'PASSED' ? '#dcfce7' : '#fee2e2', color: status === 'PASSED' ? '#166534' : '#991b1b' }),
    
    // MODAL STYLES
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 },
    modalContent: { backgroundColor: '#f8fafc', width: '90%', height: '90%', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    modalHeader: { backgroundColor: 'white', padding: '20px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalBody: { padding: '30px', overflowY: 'auto', flex: 1 },
    gridContainer: { display: 'grid', gridTemplateColumns: detailData?.data_10 && detailData?.data_12 ? '1fr 1fr' : '1fr', gap: '30px', alignItems: 'start' },
    emptyState: { textAlign: 'center', padding: '40px', color: '#64748b' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}><Calendar size={28} color="#4338ca" /> Verification History</div>
        <div style={{display:'flex', gap:'15px'}}>
            <div style={styles.searchBox}>
                <Search size={18} color="#94a3b8" />
                <input type="text" placeholder="Search..." style={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            {records.length > 0 && <button style={styles.clearBtn} onClick={handleClearHistory}><Trash2 size={16} /> Clear</button>}
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>CANDIDATE NAME</th>
              <th style={styles.th}>EMAIL</th>
              <th style={styles.th}>DETAILS</th>
              <th style={styles.th}>VERIFIED ON</th>
              <th style={styles.th}>STATUS</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" style={{textAlign:'center', padding:'30px'}}>Loading...</td></tr> : 
             filteredRecords.length === 0 ? <tr><td colSpan="7" style={{textAlign:'center', padding:'30px'}}>No records found.</td></tr> :
             filteredRecords.map((rec) => (
              <tr key={rec.admno} style={styles.tr} onClick={() => handleRowClick(rec.admno)}>
                <td style={styles.td}>#{rec.admno}</td>
                <td style={{...styles.td, fontWeight: '700', color: '#1e293b'}}>{rec.name}</td>
                {/* Display Email in the main table too if available */}
                <td style={styles.td}>{rec.email || "-"}</td> 
                <td style={styles.td}>{rec.category || "Certificate"}</td>
                <td style={styles.td}>{rec.created_at}</td>
                <td style={styles.td}><span style={styles.statusBadge(rec.status)}>{rec.status === 'PASSED' ? <FileCheck size={12}/> : <FileX size={12}/>} {rec.status}</span></td>
                <td style={styles.td}><ChevronRight size={16} color="#94a3b8"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- FULL DETAILS MODAL --- */}
      {selectedStudent && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            {/* MODAL HEADER */}
            <div style={styles.modalHeader}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                 <BookOpen size={24} color="#4338ca"/>
                 <h2 style={{fontSize:'20px', fontWeight:'800', color:'#1e293b', margin:0}}>Candidate Report</h2>
              </div>
              <button onClick={closeModal} style={{border:'none', background:'none', cursor:'pointer'}}><X size={28} color="#64748b"/></button>
            </div>
            
            {/* ✅ NEW: CONTACT INFO BAR */}
            {detailData?.contact && (
              <div style={{backgroundColor: 'white', padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '30px', fontSize: '14px', fontWeight: '600', color: '#475569'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Mail size={16} color="#64748b"/> 
                    {detailData.contact.email || "No Email Provided"}
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Phone size={16} color="#64748b"/> 
                    {detailData.contact.phone || "No Phone Provided"}
                </div>
              </div>
            )}

            <div style={styles.modalBody}>
                {loadingDetails ? (
                    <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100%'}}>
                        <Loader2 className="animate-spin" size={40} color="#4338ca"/>
                    </div>
                ) : detailData ? (
                    <div style={styles.gridContainer}>
                        {/* 10TH GRADE COLUMN */}
                        {detailData.data_10 && (
                            <div>
                                <h3 style={{fontSize:'16px', fontWeight:'800', color:'#64748b', marginBottom:'15px', textAlign:'center', textTransform:'uppercase'}}>
                                    Secondary (10th) Report
                                </h3>
                                {/* Reusing OCRResults with Save Button Hidden */}
                                <OCRResults 
                                    report={detailData.data_10} 
                                    hideSaveButton={true} 
                                    candidateEmail={detailData.contact?.email}
                                    candidatePhone={detailData.contact?.phone}
                                />
                            </div>
                        )}
                        
                        {/* 12TH GRADE COLUMN */}
                        {detailData.data_12 && (
                            <div>
                                <h3 style={{fontSize:'16px', fontWeight:'800', color:'#64748b', marginBottom:'15px', textAlign:'center', textTransform:'uppercase'}}>
                                    Higher Secondary (12th) Report
                                </h3>
                                <OCRResults 
                                    report={detailData.data_12} 
                                    hideSaveButton={true} 
                                    candidateEmail={detailData.contact?.email}
                                    candidatePhone={detailData.contact?.phone}
                                />
                            </div>
                        )}

                        {/* EMPTY STATE IF DATA MISSING */}
                        {(!detailData.data_10 && !detailData.data_12) && (
                            <div style={styles.emptyState}>No detailed report data found for this student.</div>
                        )}
                    </div>
                ) : (
                    <div style={styles.emptyState}>Failed to load details.</div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHistoryTable;