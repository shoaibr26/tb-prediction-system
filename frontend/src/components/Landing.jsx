import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Activity, Shield, Apple } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
            <div className="text-center" style={{ maxWidth: '600px' }}>
                <Stethoscope size={80} className="text-success mb-2" style={{ display: 'inline-block' }} />
                <h1 className="mb-2" style={{ fontSize: '3rem', color: '#fff' }}>
                    TB <span className="text-success">Diagnostic</span> System
                </h1>
                <p className="text-muted mb-3" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                    An advanced clinical decision support tool designed to analyze patient symptoms and chest X-rays to accurately assess the risk of Tuberculosis using medical standard guidelines.
                </p>

                <button 
                    className="btn btn-solid mb-3" 
                    style={{ fontSize: '1.2rem', padding: '1rem 2rem', borderRadius: '50px', backgroundColor: 'var(--primary-color)', color: '#000', border: 'none', fontWeight: 'bold' }}
                    onClick={() => navigate('/screening')}
                >
                    Start Screening Diagnosis
                </button>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn pill-btn" onClick={() => navigate('/symptoms')}>
                        <Activity size={18} /> Symptoms Guide
                    </button>
                    <button className="btn pill-btn" onClick={() => navigate('/precautions')}>
                        <Shield size={18} /> Precautions
                    </button>
                    <button className="btn pill-btn" onClick={() => navigate('/diet')}>
                        <Apple size={18} /> Diet & Foods
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Landing;
