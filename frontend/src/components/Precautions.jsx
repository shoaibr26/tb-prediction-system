import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, ArrowLeft } from 'lucide-react';

const Precautions = () => {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ paddingTop: '2rem' }}>
            <button className="btn mb-3" style={{ border: 'none' }} onClick={() => navigate('/')}>
                <ArrowLeft size={18} /> Back to Home
            </button>
            
            <div className="text-center mb-3">
                <h2>TB Precautions & Prevention</h2>
            </div>

            <div className="card mb-3" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={24} /> Personal Hygiene & Protection
                </h3>
                <ul className="info-list">
                    <li><strong>Wear a Mask:</strong> Always wear a medical mask (like an N95) when in close contact with an infected individual to prevent inhaling droplet nuclei.</li>
                    <li><strong>Hand Washing:</strong> Wash hands thoroughly and frequently with soap or alcohol-based sanitizer.</li>
                    <li><strong>Cover the Mouth:</strong> Use a tissue when coughing or sneezing, and dispose of it in a sealed bin immediately.</li>
                </ul>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--warning-color)' }}>
                <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={24} /> Environmental Precautions
                </h3>
                <ul className="info-list">
                    <li><strong>Ventilation:</strong> Keep living spaces well-ventilated. Open windows and ensure fresh air circulation, as TB bacteria remains suspended in stagnant air.</li>
                </ul>
            </div>
        </div>
    );
};

export default Precautions;
