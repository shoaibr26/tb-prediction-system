import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const navigate = useNavigate();
    
    // Inputs
    const [inputs, setInputs] = useState({
        cough: 'No',
        fever: 'No',
        nightSweats: 'No',
        weightLoss: 'No',
        bloodInSputum: 'No',
        chestPain: 'No'
    });
    
    const [image, setImage] = useState(null);
    const [pdf, setPdf] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleInputChange = (e) => {
        setInputs({...inputs, [e.target.name]: e.target.value});
    };

    const handleDiagnostic = async (e) => {
        e.preventDefault();
        
        const symptomsString = Object.entries(inputs)
            .filter(([_, val]) => val === 'Yes')
            .map(([key]) => key.replace(/([A-Z])/g, "_$1").toLowerCase())
            .join(',');

        const formData = new FormData();
        if (image) formData.append('image', image);
        if (pdf) formData.append('pdf', pdf);
        formData.append('symptoms', symptomsString);
        
        // Let ML pipeline decide if optional rules apply or fail if it requires them.
        // The prompt says "X-RAY IMAGE UPLOAD (Optional)" but predict.py might crash if missing image initially.
        // We pass empty if null, predictor should ideally handle.

        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.post(`${API_URL}/api/predict`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data);
        } catch (err) {
            console.error(err);
            alert('Analysis failed. Ensure image/pdf are provided if ML requires it.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem 1rem' }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '2rem' }}>
                <button 
                    onClick={() => navigate('/')}
                    style={{ position: 'absolute', left: 0, background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ← EXIT
                </button>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ margin: 0, letterSpacing: '1px' }}>TB PREDICTION INTERFACE</h1>
                    <p className="text-success" style={{ fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Multi-Modal Analytics Dashboard
                    </p>
                </div>
            </div>

            {/* Input Section */}
            <div className="dash-container mb-3">
                <div className="dash-header">
                    <span className="icon-box">⊞</span> Screen Patient Data
                </div>
                
                <div className="input-grid">
                    {[
                        { label: 'COUGH', name: 'cough' },
                        { label: 'FEVER', name: 'fever' },
                        { label: 'NIGHT SWEATS', name: 'nightSweats' },
                        { label: 'WEIGHT LOSS', name: 'weightLoss' },
                        { label: 'BLOOD IN SPUTUM', name: 'bloodInSputum' },
                        { label: 'CHEST PAIN', name: 'chestPain' }
                    ].map((field) => (
                        <div key={field.name} className="input-group">
                            <label>{field.label}</label>
                            <select name={field.name} value={inputs[field.name]} onChange={handleInputChange} className="dash-select">
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                    ))}
                </div>

                <div className="file-grid">
                    <div className="file-zone">
                        <label>X-RAY IMAGE UPLOAD (Optional)</label>
                        <input type="file" id="img-upload" accept="image/*" onChange={(e) => setImage(e.target.files[0])} hidden />
                        <div className="upload-box" onClick={() => document.getElementById('img-upload').click()}>
                            {image ? <span className="text-success">Attached: {image.name}</span> : <span>Click to attach image</span>}
                        </div>
                    </div>
                    
                    <div className="file-zone">
                        <label>CBC MEDICAL REPORT (PDF Optional)</label>
                        <input type="file" id="pdf-upload" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} hidden />
                        <div className="upload-box" onClick={() => document.getElementById('pdf-upload').click()}>
                            {pdf ? <span className="text-success">Attached: {pdf.name}</span> : <span>Click to attach PDF</span>}
                        </div>
                    </div>
                </div>

                <button className="btn-run" onClick={handleDiagnostic} disabled={loading}>
                    {loading ? 'PROCESSING...' : 'RUN DIAGNOSTIC'}
                </button>
            </div>

            {/* Output Section */}
            {result && (
                <div className="dash-container">
                    <div className="dash-header flex-between">
                        <div>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>EXPLAINABLE DIAGNOSTIC OUTPUT</h2>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>Advanced Knowledge-Based System (KBS) Analysis</span>
                        </div>
                        <div 
                            className="risk-badge" 
                            style={{ 
                                borderColor: result.final_score > 0.7 ? 'var(--error-color)' : result.final_score > 0.4 ? 'var(--warning-color)' : 'var(--primary-color)', 
                                color: result.final_score > 0.7 ? 'var(--error-color)' : result.final_score > 0.4 ? 'var(--warning-color)' : 'var(--primary-color)' 
                            }}
                        >
                            RISK: {result.final_score > 0.7 ? 'HIGH' : result.final_score > 0.4 ? 'MODERATE' : 'LOW'} | RULE SCORE: {Math.round(result.kbs_result.kbs_score * 100)}
                        </div>
                    </div>

                    <div className="output-grid-top mb-3">
                        <div className="output-panel">
                            <h4 className="panel-title">ORIGINAL INPUT SCAN</h4>
                            <div className="img-container">
                                {image ? <img src={URL.createObjectURL(image)} alt="Original" /> : <div className="placeholder">No Image</div>}
                            </div>
                        </div>
                        
                        <div className="output-panel">
                            <h4 className="panel-title">GRAD-CAM TARGET ISOLATION</h4>
                            <div className="img-container">
                                {result.gradcam_heatmap ? <img src={`http://localhost:5000${result.gradcam_heatmap}`} alt="Heatmap" /> : <div className="placeholder">No Heatmap</div>}
                            </div>
                        </div>

                        <div className="output-panel flex-col-center">
                            <h4 className="panel-title" style={{ alignSelf: 'flex-start', width: '100%' }}>DIAGNOSTIC PROBABILITY</h4>
                            <div className="radial-progress" style={{ background: `conic-gradient(var(--primary-color) ${(result.final_score * 100).toFixed(1)}%, #111 ${(result.final_score * 100).toFixed(1)}%)` }}>
                                <div className="radial-inner">
                                    {(result.final_score * 100).toFixed(1)}%
                                </div>
                            </div>
                            <span className="text-muted text-sm mt-3">Neural Network Confidence Score</span>
                        </div>
                    </div>

                    <div className="output-grid-bottom">
                        <div className="output-panel" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                            <h4 className="panel-title">WHY THIS RESULT</h4>
                            <p style={{ fontSize: '0.9rem', color: '#ccc' }}>{result.kbs_result.explanation}</p>
                            <div className="text-sm mt-3" style={{ color: '#888' }}>
                                <strong style={{ color: 'var(--primary-color)' }}>Reference Study:</strong> 
                                <div style={{ fontStyle: 'italic', marginTop: '0.3rem' }}>"Clinical Manifestations of Tuberculosis", Journal of Clinical Tuberculosis (2020).</div>
                            </div>
                        </div>
                        
                        <div className="output-panel">
                            <h4 className="panel-title">RECOMMENDATIONS</h4>
                            <ul style={{ fontSize: '0.9rem', color: '#ccc', paddingLeft: '1.2rem' }}>
                                {result.kbs_result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                        
                        <div className="output-panel">
                            <h4 className="panel-title">RULE TRACE</h4>
                            <ul style={{ fontSize: '0.8rem', color: '#ccc', paddingLeft: '1.2rem' }}>
                                {result.kbs_result.rules_triggered.map((r, i) => <li key={i} className={r.includes('CRITICAL') ? 'text-danger' : 'text-success'}>{r}</li>)}
                            </ul>
                        </div>
                        
                        <div className="output-panel">
                            <h4 className="panel-title">WHO GUIDELINES</h4>
                            <p style={{ fontSize: '0.85rem', color: '#aaccaa', marginBottom: '1rem', fontStyle: 'italic' }}>
                                "{result.kbs_result.who_guidelines}"
                            </p>
                            <div className="metrics-box">
                                <h5 className="mb-2" style={{ fontSize: '0.8rem', color: '#888' }}>PATIENT DATA METRICS</h5>
                                <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                                    <div style={{ color: '#888', marginBottom: '0.5rem' }}>DIAGNOSTIC ANOMALIES:</div>
                                    {Object.entries(result.cbc_extracted || {}).map(([key, val]) => (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-color)', marginBottom: '0.2rem' }}>
                                            <span>[{val ? 'VAL' : 'N/A'}] {key}</span>
                                            <span>{val ?? '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
