import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

def train_tabular_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, 'data', 'tabular')
    
    # Find CSV file
    csv_files = [f for f in os.listdir(data_dir) if f.endswith('.csv')] if os.path.exists(data_dir) else []
    
    if not csv_files:
        print("Dataset not found. Please run download_data.py first.")
        return
        
    csv_path = os.path.join(data_dir, csv_files[0])
    df = pd.read_csv(csv_path)
    
    # We expect columns like 'Hemoglobin', 'WBC', 'RBC', 'Platelets', 'ESR', 'PCV'
    # and a label column like 'Diagnosis' or 'TB' or 'Result'
    # Need to find the target column
    target_cols = ['Diagnosis', 'TB_Status', 'Result', 'Target', 'Label']
    target_col = None
    for col in target_cols:
        if col in df.columns:
            target_col = col
            break
            
    if not target_col:
        # If standard names fail, assume the last column is target
        target_col = df.columns[-1]
    
    print(f"Using '{target_col}' as the target column.")

    # Drop non-numeric for simplicity except target
    # If there are string values, basic encoding could be applied
    df = df.dropna()  # Basic dropping NAs
    
    # Select our target features if they exist, otherwise use all numerics
    expected_features = ['Hemoglobin', 'WBC', 'RBC', 'Platelets', 'ESR', 'PCV']
    actual_features = [col for col in expected_features if col in df.columns]
    
    if len(actual_features) == 0:
        # If expected columns don't exist exactly, just use all numeric
        X = df.select_dtypes(include=['number']).drop(columns=[target_col], errors='ignore')
    else:
        X = df[actual_features]
        
    y = df[target_col]
    
    # Convert targets to binary if not already
    if y.dtype == object:
        y = (y == y.unique()[0]).astype(int)  # Naive binary encoding

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Tabular Model (RandomForest)...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    
    model_path = os.path.join(base_dir, 'tabular_model.pkl')
    # Save the feature names alongside the model so predict.py knows exactly what features to use
    joblib.dump({'model': clf, 'features': list(X.columns)}, model_path)
    print(f"Tabular model saved to {model_path}")

if __name__ == '__main__':
    train_tabular_model()
