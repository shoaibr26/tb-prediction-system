import sys
import os
import json
import re
import cv2
import numpy as np
import pdfplumber
import joblib
import tensorflow as tf
from tensorflow.keras.models import load_model

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TF logs

def extract_cbc_from_pdf(pdf_path):
    # Regex targeting only real clinical CBC markers
    markers = {
        'Hemoglobin': re.compile(r'hemoglobin.*?([\d\.]+)', re.IGNORECASE),
        'WBC': re.compile(r'(?:wbc|white blood cells).*?([\d\.]+)', re.IGNORECASE),
        'RBC': re.compile(r'(?:rbc|red blood cells).*?([\d\.]+)', re.IGNORECASE),
        'Platelets': re.compile(r'platelets.*?([\d\.]+)', re.IGNORECASE),
        'ESR': re.compile(r'esr.*?([\d\.]+)', re.IGNORECASE),
        'PCV': re.compile(r'pcv.*?([\d\.]+)', re.IGNORECASE)
    }
    extracted = {k: None for k in markers}
    features = []
    
    # Handle missing or dummy PDF path
    if not pdf_path or pdf_path.lower() == "none" or not os.path.exists(pdf_path):
        return {"info": "No PDF provided"}, [0.0]*len(markers)

    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = " ".join([page.extract_text() or "" for page in pdf.pages])
            
            for key, pattern in markers.items():
                match = pattern.search(text)
                if match:
                    try:
                        extracted[key] = float(match.group(1))
                    except ValueError:
                        extracted[key] = None
                features.append(extracted[key] if extracted[key] is not None else 0.0)
    except Exception as e:
        features = [0.0]*len(markers)
        extracted = {'error': str(e)}

    return extracted, features

def make_gradcam_heatmap(img_array, model, last_conv_layer_name, pred_index=None):
    try:
        grad_model = tf.keras.models.Model(
            model.inputs, [model.get_layer(last_conv_layer_name).output, model.output]
        )

        with tf.GradientTape() as tape:
            last_conv_layer_output, preds = grad_model(img_array)
            if pred_index is None:
                pred_index = tf.argmax(preds[0])
            class_channel = preds[:, pred_index]

        grads = tape.gradient(class_channel, last_conv_layer_output)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        last_conv_layer_output = last_conv_layer_output[0]
        heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)
        heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
        return heatmap.numpy()
    except Exception:
        return np.zeros((7, 7))

def save_gradcam(img_path, heatmap, out_path, alpha=0.4):
    try:
        img = cv2.imread(img_path)
        heatmap = cv2.resize(heatmap, (img.shape[1], img.shape[0]))
        heatmap = np.uint8(255 * heatmap)
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        
        superimposed_img = heatmap * alpha + img
        cv2.imwrite(out_path, superimposed_img)
    except Exception as e:
        pass

def evaluate_kbs(cbc_data, symptoms):
    kb_score = 0.0
    rules_triggered = []
    recommendations = []
    override = False

    if cbc_data.get('Hemoglobin') is not None:
        hb = cbc_data['Hemoglobin']
        if hb < 11.0:
            kb_score += 0.15
            rules_triggered.append(f"Hemoglobin is LOW ({hb}) -> Indicates anemia, common in chronic infections like TB.")
            recommendations.append("Consider iron supplementation and further anemia workup.")

    if cbc_data.get('WBC') is not None:
        wbc = cbc_data['WBC']
        if wbc > 11.0:
            kb_score += 0.2
            rules_triggered.append(f"WBC count is HIGH ({wbc}) -> Strong indicator of active infection.")
            recommendations.append("Antibiotic/Anti-tubercular therapy evaluation required due to active infection.")

    if cbc_data.get('ESR') is not None:
        esr = cbc_data['ESR']
        if esr > 20:
            kb_score += 0.15
            rules_triggered.append(f"ESR is ELEVATED ({esr}) -> Indicates active systemic inflammation.")
    
    symptom_weights = {
        'chronic_cough': 0.15, 'weight_loss': 0.15, 'night_sweats': 0.15,
        'fever': 0.1, 'chest_pain': 0.1, 'fatigue': 0.05
    }
    
    for s in symptoms:
        s_lower = s.lower().replace('_', ' ')
        if s_lower in symptom_weights:
            kb_score += symptom_weights[s_lower]
            rules_triggered.append(f"Symptom '{s}' contributes to clinical risk profile.")
        
        if 'hemoptysis' in s_lower or 'blood in sputum' in s_lower:
            override = True
            rules_triggered.append(f"CRITICAL OVERRIDE: Hemoptysis (Coughing blood) detected -> AUTOMATIC HIGH RISK.")
            recommendations.append("EMERGENCY RESPONSE: Isolate patient and schedule immediate pulmonology consult.")

    kb_score = min(max(kb_score, 0.0), 1.0)
    
    if not recommendations:
        recommendations.append("Monitor patient and repeat tests if symptoms worsen.")

    who_guidelines = "According to WHO, patients with chronic cough (>2 weeks) accompanied by weight loss or night sweats should be prioritized for TB screening."

    explanation = "Based on clinical findings, "
    if override:
        explanation += "critical symptoms mandate immediate intervention. "
    elif kb_score > 0.5:
        explanation += "the aggregation of clinical markers and symptoms suggests active infection. "
    else:
        explanation += "clinical markers are mostly stable. "

    return {
        'kbs_score': kb_score,
        'rules_triggered': rules_triggered,
        'recommendations': recommendations,
        'who_guidelines': who_guidelines,
        'explanation': explanation,
        'override': override
    }

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Insufficient arguments"}))
        sys.exit(1)

    image_path = sys.argv[1]
    pdf_path = sys.argv[2]
    symptoms = sys.argv[3].split(',') if len(sys.argv) > 3 else []
    output_dir = os.path.dirname(image_path) if os.path.exists(image_path) else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend', 'uploads')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    base_dir = os.path.dirname(os.path.abspath(__file__))

    try:
        vision_model_path = os.path.join(base_dir, 'vision_model.h5')
        tabular_model_data_path = os.path.join(base_dir, 'tabular_model.pkl')
        
        vision_model = load_model(vision_model_path) if os.path.exists(vision_model_path) else None
        tabular_data = joblib.load(tabular_model_data_path) if os.path.exists(tabular_model_data_path) else None
        tabular_model = tabular_data['model'] if tabular_data else None

        cbc_extracted, features = extract_cbc_from_pdf(pdf_path)

        # Tabular Prediction
        tabular_score = None
        if tabular_model and pdf_path.lower() != "none" and os.path.exists(pdf_path):
            expected_features_len = len(tabular_data.get('features', []))
            feat_arr = np.array(features)
            if len(feat_arr) < expected_features_len:
                feat_arr = np.pad(feat_arr, (0, expected_features_len - len(feat_arr)))
            else:
                feat_arr = feat_arr[:expected_features_len]
            tabular_score = float(tabular_model.predict_proba([feat_arr])[0][1])

        # Vision Prediction & Grad-CAM
        vision_score = None
        gradcam_url = None
        if vision_model and image_path.lower() != "none" and os.path.exists(image_path):
            img = tf.keras.preprocessing.image.load_img(image_path, target_size=(224, 224))
            img_array = tf.keras.preprocessing.image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0) / 255.0
            
            vision_score = float(vision_model.predict(img_array)[0][0])
            
            last_conv_layer = 'out_relu'
            for layer in reversed(vision_model.layers):
                if isinstance(layer, tf.keras.layers.Conv2D):
                    last_conv_layer = layer.name
                    break
            
            heatmap = make_gradcam_heatmap(img_array, vision_model, last_conv_layer)
            gradcam_path = os.path.join(output_dir, f"heatmap_{os.path.basename(image_path)}")
            save_gradcam(image_path, heatmap, gradcam_path)
            gradcam_url = f"/uploads/{os.path.basename(gradcam_path)}"

        # Fusion logic
        scores = []
        if vision_score is not None: scores.append(vision_score)
        if tabular_score is not None: scores.append(tabular_score)
        
        ml_score = sum(scores) / len(scores) if scores else 0.0

        kbs_result = evaluate_kbs(cbc_extracted, symptoms)

        final_score = 0.6 * ml_score + 0.4 * kbs_result['kbs_score']
        if kbs_result['override']:
            final_score = 0.95

        result = {
            "ml_score": ml_score,
            "vision_score": vision_score if vision_score is not None else 0.0,
            "tabular_score": tabular_score if tabular_score is not None else 0.0,
            "kbs_result": kbs_result,
            "final_score": final_score,
            "cbc_extracted": cbc_extracted,
            "gradcam_heatmap": gradcam_url
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
