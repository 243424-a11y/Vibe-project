"""
V.I.B.E ML Service - Fraud Detection Model Training
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FraudDetectionModel:
    """Ensemble fraud detection model using Random Forest + Isolation Forest"""
    
    def __init__(self):
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.if_model = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.feature_names = [
            'bid_frequency',
            'bid_pattern_variance',
            'account_age_days',
            'device_consistency',
            'temporal_anomaly',
            'auction_context_similarity'
        ]
        self.model_version = '1.0'
        self.accuracy = 0.0
        
    def generate_training_data(self, n_samples=1000):
        """Generate synthetic training data for demo purposes"""
        logger.info(f'Generating {n_samples} synthetic training samples...')
        
        # Generate normal behavior data
        normal_samples = n_samples * 3 // 4
        X_normal = np.random.normal(loc=0.3, scale=0.2, size=(normal_samples, len(self.feature_names)))
        y_normal = np.zeros(normal_samples)
        
        # Generate fraud/suspicious behavior data
        fraud_samples = n_samples // 4
        X_fraud = np.random.normal(loc=0.7, scale=0.3, size=(fraud_samples, len(self.feature_names)))
        y_fraud = np.ones(fraud_samples)
        
        # Combine and shuffle
        X = np.vstack([X_normal, X_fraud])
        y = np.hstack([y_normal, y_fraud])
        
        # Shuffle
        shuffle_idx = np.random.permutation(X.shape[0])
        X = X[shuffle_idx]
        y = y[shuffle_idx]
        
        # Clamp values to [0, 1]
        X = np.clip(X, 0, 1)
        
        return X, y
    
    def train(self, X=None, y=None):
        """Train the fraud detection model"""
        
        if X is None:
            X, y = self.generate_training_data(n_samples=1000)
        
        logger.info('Training fraud detection model...')
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Random Forest model
        logger.info('Training Random Forest model...')
        self.rf_model.fit(X_train_scaled, y_train)
        rf_pred = self.rf_model.predict(X_test_scaled)
        
        # Train Isolation Forest model
        logger.info('Training Isolation Forest model...')
        self.if_model.fit(X_train_scaled)
        if_pred = (self.if_model.predict(X_test_scaled) == -1).astype(int)
        
        # Ensemble prediction (weighted average)
        ensemble_pred = (rf_pred + if_pred) / 2
        ensemble_pred = (ensemble_pred > 0.5).astype(int)
        
        # Evaluate
        self.accuracy = accuracy_score(y_test, ensemble_pred)
        precision = precision_score(y_test, ensemble_pred)
        recall = recall_score(y_test, ensemble_pred)
        f1 = f1_score(y_test, ensemble_pred)
        
        logger.info(f'Model Performance:')
        logger.info(f'  Accuracy:  {self.accuracy:.4f}')
        logger.info(f'  Precision: {precision:.4f}')
        logger.info(f'  Recall:    {recall:.4f}')
        logger.info(f'  F1-Score:  {f1:.4f}')
        
        return self.accuracy
    
    def predict(self, features):
        """
        Predict fraud score for new data
        Features: [bid_frequency, bid_pattern, account_age, device_consistency, temporal, context]
        Returns: fraud_score (0-1)
        """
        try:
            # Ensure features is a numpy array
            if isinstance(features, dict):
                features = np.array([
                    features.get('bid_frequency', 0.5),
                    features.get('bid_pattern', 0.5),
                    features.get('account_age', 0.5),
                    features.get('device_consistency', 0.5),
                    features.get('temporal_pattern', 0.5),
                    features.get('auction_context', 0.5)
                ]).reshape(1, -1)
            else:
                features = np.array(features).reshape(1, -1)
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Get predictions from both models
            rf_score = self.rf_model.predict_proba(features_scaled)[0][1]
            if_score = 1 if self.if_model.predict(features_scaled)[0] == -1 else 0
            
            # Ensemble score (weighted average: 70% RF, 30% IF)
            fraud_score = 0.7 * rf_score + 0.3 * if_score
            
            return float(np.clip(fraud_score, 0, 1))
        except Exception as e:
            logger.error(f'Error predicting fraud score: {str(e)}')
            return 0.5  # Default to neutral score on error
    
    def save_model(self, path='models/fraud_model.joblib'):
        """Save trained model to disk"""
        try:
            model_data = {
                'rf_model': self.rf_model,
                'if_model': self.if_model,
                'scaler': self.scaler,
                'accuracy': self.accuracy,
                'version': self.model_version,
                'features': self.feature_names,
                'trained_at': datetime.now().isoformat()
            }
            joblib.dump(model_data, path)
            logger.info(f'Model saved to {path}')
            return True
        except Exception as e:
            logger.error(f'Error saving model: {str(e)}')
            return False
    
    def load_model(self, path='models/fraud_model.joblib'):
        """Load trained model from disk"""
        try:
            model_data = joblib.load(path)
            self.rf_model = model_data['rf_model']
            self.if_model = model_data['if_model']
            self.scaler = model_data['scaler']
            self.accuracy = model_data['accuracy']
            self.model_version = model_data['version']
            logger.info(f'Model loaded from {path}')
            return True
        except Exception as e:
            logger.error(f'Error loading model: {str(e)}')
            return False


def main():
    """Train and save the fraud detection model"""
    logger.info('V.I.B.E Fraud Detection Model Training')
    logger.info('=' * 50)
    
    # Create model
    model = FraudDetectionModel()
    
    # Train model
    accuracy = model.train()
    
    # Save model
    model.save_model()
    
    logger.info(f'Model training completed with accuracy: {accuracy:.4f}')
    logger.info('=' * 50)


if __name__ == '__main__':
    main()
