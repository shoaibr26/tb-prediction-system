import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, ArrowLeft } from 'lucide-react';

const Diet = () => {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ paddingTop: '2rem' }}>
            <button className="btn mb-3" style={{ border: 'none' }} onClick={() => navigate('/')}>
                <ArrowLeft size={18} /> Back to Home
            </button>
            
            <div className="text-center mb-3">
                <h2>Tuberculosis Diet Guide</h2>
            </div>

            <div className="card mb-3" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Apple size={24} /> Macronutrients & Importance
                </h3>
                <p>
                    TB causes severe tissue breakdown and muscle wasting. A high-calorie, high-protein diet is crucial for rebuilding the immune system and accelerating recovery alongside your medication.
                </p>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Apple size={24} /> Recommended Foods (To Eat)
                </h3>
                <ul className="info-list">
                    <li><strong>Proteins (Building Blocks):</strong> Eggs, Lean chicken, Fish, and Milk/Paneer. Essential for repairing tissue.</li>
                    <li><strong>Vitamins A, C, & E (Immune Boosters):</strong> Carrots, Oranges, Mangoes, Tomatoes. These are antioxidants that destroy free radicals.</li>
                    <li><strong>Zinc & Iron:</strong> Spinach, Nuts and seeds. Helps support lung function and boosts red blood cell count to fight weakness.</li>
                </ul>
            </div>
        </div>
    );
};

export default Diet;
