import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CheckCircle2, XCircle, AlertTriangle, User, BookOpen,
    Fingerprint, Award, ShieldCheck, Hash, Save, Loader2
} from 'lucide-react';

// ✅ UPDATE: Robust Data Handling & UI Text Change
const OCRResults = ({ report, hideSaveButton, candidateEmail, candidatePhone }) => {
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    // --- DEBUG LOG: Check console to ensure new code is running ---
    useEffect(() => {
        if (report) console.log("OCRResults Loaded with Report:", report);
    }, [report]);

    if (!report) return null;

    //  SUPER SAFE DATA EXTRACTION 
    let safeData = null;
    let safeVerification = null;

    // Case 1: Nested Structure (Fresh Scan or New Save)
    if (report.extracted_data && report.extracted_data.details) {
        safeData = report.extracted_data;
        safeVerification = report.verification_report;
    }
    // Case 2: Flat Structure (Old History Save)
    else if (report.details) {
        safeData = report;
        safeVerification = report.verification_report || {
            final_verdict: report.details.result_status || "UNKNOWN",
            issues: [],
            identity_status: "UNKNOWN",
            tamper_check: { status: "UNKNOWN" }
        };
    }

    // If we still don't have details, the data is corrupted/empty
    if (!safeData || !safeData.details) {
        return (
            <div style={{ padding: '20px', color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                ⚠️ Error: Report data is incomplete or corrupted. Please clear history and try again.
            </div>
        );
    }

    // Now we can safely destructure
    const { details, subjects } = safeData;
    const { final_verdict, issues, identity_status, tamper_check, document_mismatch, mismatch_reason } = safeVerification || {};

    const positiveKeywords = ["authentic", "match", "verified", "clean", "success"];

    const realDiscrepancies = issues ? issues.filter(issue =>
        !positiveKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    ) : [];

    const forensicNotes = issues ? issues.filter(issue =>
        positiveKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    ) : [];

    const passed = final_verdict === "PASSED" || realDiscrepancies.length === 0;
    const displayVerdict = passed ? "PASSED" : "FLAGGED";

    const certType = safeData.type || "UNKNOWN";
    const grading = details.grading || { score_display: "N/A", percentage: "N/A" };

    const formatCertType = (type) => {
        switch (type) {
            case 'KERALA_SSLC': return 'KERALA STATE SSLC (10th)';
            case 'CBSE_10': return 'CBSE CLASS 10';
            case 'KERALA_HSE': return 'KERALA HIGHER SECONDARY (12th)';
            case 'CBSE_12': return 'CBSE CLASS 12';
            default: return type;
        }
    };

    const handleManualSave = async () => {
        setSaving(true);
        setSaveStatus(null);

        const payload = {
            ...safeData, // Spread the extracted data
            extracted_data: safeData, // Ensure nested structure for future
            verification_report: safeVerification, // Ensure verification report is saved
            email: candidateEmail || "",
            phone: candidatePhone || "",
            details: {
                ...details,
                result_status: displayVerdict
            }
        };

        try {
            await axios.post('http://localhost:5000/api/db/save', payload);
            setSaveStatus('success');
        } catch (error) {
            console.error("Save failed:", error);
            setSaveStatus('error');
        }
        setSaving(false);
    };

    const styles = {
        container: { marginTop: '25px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', animation: 'slideDown 0.4s ease', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' },
        header: { padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: passed ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' },
        headerLeft: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: '700' },
        verdictBadge: { backgroundColor: 'rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', border: '1px solid rgba(255,255,255,0.3)' },
        body: { padding: '30px' },
        statusGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' },
        statusItem: (positive) => ({ backgroundColor: positive ? '#f0fdf4' : '#fef2f2', color: positive ? '#166534' : '#991b1b', border: `1px solid ${positive ? '#bbf7d0' : '#fecaca'}`, borderRadius: '12px', padding: '16px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }),
        sectionTitle: { fontSize: '14px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' },
        dataGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px 20px', marginBottom: '30px' },
        field: { display: 'flex', flexDirection: 'column' },
        label: { fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' },
        value: { fontSize: '14px', fontWeight: '700', color: '#0f172a' },
        tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
        table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
        th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '800', fontSize: '12px' },
        td: { padding: '14px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontWeight: '600' },
        gradeTd: { padding: '14px 16px', borderBottom: '1px solid #f1f5f9', color: '#4338ca', fontWeight: '800' },
        footer: { marginTop: '30px', padding: '25px', backgroundColor: '#eef2ff', borderRadius: '16px', border: '1px solid #c7d2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        scoreLabel: { fontSize: '13px', color: '#3730a3', fontWeight: '700', marginBottom: '6px' },
        scoreValue: { fontSize: '24px', fontWeight: '900', color: '#1e3a8a' },
        percentageBadge: { fontSize: '28px', fontWeight: '900', color: '#4338ca', backgroundColor: '#ffffff', padding: '8px 20px', borderRadius: '12px', boxShadow: '0 4px 15px -3px rgba(67, 56, 202, 0.15)' },
        saveBtn: { width: '100%', marginTop: '30px', padding: '14px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: saveStatus === 'success' ? '#dcfce7' : '#1e1b4b', color: saveStatus === 'success' ? '#166534' : 'white', transition: 'all 0.2s', pointerEvents: saveStatus === 'success' ? 'none' : 'auto', boxShadow: '0 4px 12px rgba(30, 27, 75, 0.2)' }
    };

    const Field = ({ label, value, fullWidth }) => {
        if (!value || value === "N/A") return null;
        return (<div style={{ ...styles.field, gridColumn: fullWidth ? 'span 2' : 'auto' }}><span style={styles.label}>{label}</span><span style={styles.value}>{value}</span></div>);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    {passed ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    <span>REPORT: {formatCertType(certType)}</span>
                </div>
                <span style={styles.verdictBadge}>{displayVerdict}</span>
            </div>
            <div style={styles.body}>
                {/* 🚨 CRITICAL DOC MISMATCH ALERT 🚨 */}
                {document_mismatch && (
                    <div style={{ marginTop: '0px', marginBottom: '20px', padding: '16px', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', color: '#991b1b', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)' }}>
                        <div style={{ backgroundColor: '#fca5a5', padding: '10px', borderRadius: '50%' }}>
                            <AlertTriangle size={24} color="#7f1d1d" />
                        </div>
                        <div>
                            <div style={{ fontWeight: '900', fontSize: '16px', marginBottom: '4px', color: '#7f1d1d' }}>CRITICAL DOCUMENT MISMATCH</div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{mismatch_reason || "The Uploaded PDF does not match the Scanned Image."}</div>
                        </div>
                    </div>
                )}
                <div style={styles.statusGrid}>
                    <div style={styles.statusItem(identity_status === "MATCH")}><User size={18} /> ID MATCH: {identity_status}</div>
                    <div style={styles.statusItem(tamper_check && tamper_check.status === "Clean")}><Fingerprint size={18} /> INTEGRITY: {tamper_check ? tamper_check.status : "UNKNOWN"}</div>
                </div>

                {realDiscrepancies.length > 0 && (
                    <div style={{ marginTop: '0px', marginBottom: '30px', padding: '16px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: '800', marginBottom: '6px' }}>
                            <AlertTriangle size={18} /> DISCREPANCIES DETECTED
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '28px', color: '#991b1b', fontSize: '14px', lineHeight: '1.5' }}>
                            {realDiscrepancies.map((issue, idx) => <li key={idx}>{issue}</li>)}
                        </ul>
                    </div>
                )}

                {forensicNotes.length > 0 && (
                    <div style={{ marginTop: '0px', marginBottom: '30px', padding: '16px', backgroundColor: '#f0fdf4', borderLeft: '4px solid #16a34a', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: '800', marginBottom: '6px' }}>
                            {/* ✅ UPDATED TEXT: Removed 'FORENSIC' */}
                            <ShieldCheck size={18} /> VERIFICATION PASSED
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '28px', color: '#166534', fontSize: '14px', lineHeight: '1.5' }}>
                            {forensicNotes.map((note, idx) => <li key={idx}>{note}</li>)}
                        </ul>
                    </div>
                )}

                <div style={styles.sectionTitle}><User size={16} /> Candidate Profile</div>
                <div style={styles.dataGrid}>
                    <Field label="Candidate Name" value={details.name} /> <Field label="Register Number" value={details.reg_no} /> <Field label="Date of Birth" value={details.dob} /> <Field label="Gender" value={details.sex} /> <Field label="Father's Name" value={details.father} /> <Field label="Mother's Name" value={details.mother} /> <Field label="Guardian" value={details.guardian} /> <Field label="Religion / Caste" value={details.caste_religion} /> <Field label="Nationality" value={details.nationality} /> <Field label="Place of Birth" value={details.place_of_birth} />
                </div>

                <div style={styles.sectionTitle}><Hash size={16} /> Examination Details</div>
                <div style={styles.dataGrid}>
                    <Field label="School Name" value={details.school} fullWidth /> <Field label="School Code" value={details.school_code} /> <Field label="Exam Month/Year" value={details.exam_month_year} /> <Field label="Result Date" value={details.date_of_result} /> <Field label="Stream" value={details.stream} />
                </div>

                <div style={styles.sectionTitle}><BookOpen size={16} /> Academic Record</div>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}><thead><tr><th style={styles.th}>SUBJECT</th>{certType !== "KERALA_SSLC" && <th style={styles.th}>MARKS OBTAINED</th>}<th style={styles.th}>GRADE</th></tr></thead><tbody>{subjects && subjects.map((sub, i) => (<tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f8fafc' }}><td style={styles.td}>{sub.subject}</td>{certType !== "KERALA_SSLC" && <td style={styles.td}>{sub.marks}</td>}<td style={styles.gradeTd}>{sub.grade}</td></tr>))}</tbody></table>
                </div>

                {(certType !== "KERALA_SSLC") && (<div style={styles.footer}><div><div style={styles.scoreLabel}><Award size={14} style={{ display: 'inline', marginRight: '6px' }} />AGGREGATE SCORE</div><div style={styles.scoreValue}>{grading.score_display}</div></div><div style={{ textAlign: 'right' }}><div style={styles.scoreLabel}>PERCENTAGE</div><div style={styles.percentageBadge}>{grading.percentage}</div></div></div>)}

                {!hideSaveButton && (<button onClick={handleManualSave} disabled={saving || saveStatus === 'success'} style={styles.saveBtn}>{saving ? <Loader2 className="animate-spin" size={18} /> : saveStatus === 'success' ? <CheckCircle2 size={18} /> : <Save size={18} />}{saving ? "Saving Record..." : saveStatus === 'success' ? "Record Saved Successfully" : saveStatus === 'error' ? "Retry Saving" : "Save Record to Database"}</button>)}
            </div>
        </div>
    );
};
export default OCRResults;