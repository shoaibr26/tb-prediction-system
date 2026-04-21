import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft } from 'lucide-react';

const Symptoms = () => {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ paddingTop: '2rem' }}>
            <button className="btn mb-3" style={{ border: 'none' }} onClick={() => navigate('/')}>
                <ArrowLeft size={18} /> Back to Home
            </button>
            
            <div className="text-center mb-3">
                <h2>TB Symptoms & Medical Advice</h2>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={24} /> Detailed Tuberculosis Symptoms
                </h3>
                <ul className="info-list">
                    <li><strong>Persistent Cough:</strong> A cough lasting 3 weeks or longer, which is the most prominent indicator.</li>
                    <li><strong>Hemoptysis (Blood in Sputum):</strong> Coughing up blood or heavily discolored sputum.</li>
                    <li><strong>Chest Pain:</strong> Sharp pain in the chest when breathing or coughing.</li>
                    <li><strong>Night Sweats:</strong> Waking up in the middle of the night drenched in sweat regardless of room temperature.</li>
                    <li><strong>Weight Loss & Anorexia:</strong> Sudden, unexplained weight loss and a complete loss of appetite.</li>
                    <li><strong>Fever & Chills:</strong> Developing a low-grade fever, particularly in the afternoon or evening.</li>
                    <li><strong>Extreme Fatigue:</strong> Feeling constantly exhausted and physically weak.</li>
                </ul>
            </div>
        </div>
    );
};

export default Symptoms;
