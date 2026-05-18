from flask import Flask, request, jsonify
import numpy as np
import json
import os
from datetime import datetime
import logging
import sys

# Add training module to path
sys.path.insert(0, '../training')
from train_model import FraudDetectionModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Initialize model
logger.info('Loading fraud detection model...')
MODEL = FraudDetectionModel()

# Try to load existing model
MODEL_PATH = '../models/fraud_model.joblib'
if os.path.exists(MODEL_PATH):
    success = MODEL.load_model(MODEL_PATH)
    if success:
        logger.info(f'✓ Model loaded from {MODEL_PATH}')
    else:
        logger.warn('Failed to load model, training new model...')
        MODEL.train()
        MODEL.save_model(MODEL_PATH)
else:
    logger.info('No existing model found, training new model...')
    MODEL.train()
    MODEL.save_model(MODEL_PATH)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'V.I.B.E ML Service',
        'model_version': MODEL.model_version,
        'model_accuracy': f'{MODEL.accuracy:.2%}',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/score-bid', methods=['POST'])
def score_bid():
    """
    Real-time fraud scoring for incoming bid
    Expected latency: < 100ms
    """
    try:
        start_time = datetime.now()
        data = request.json
        
        # Validate required fields
        required_fields = ['user_id', 'auction_id', 'bid_amount']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields',
                'required': required_fields
            }), 400

        user_id = data['user_id']
        auction_id = data['auction_id']
        bid_amount = data['bid_amount']

        # Extract features
        features = extract_features(user_id, auction_id, bid_amount)
        
        # Score bid using trained model
        fraud_score = MODEL.predict(features)
        
        risk_level = 'low' if fraud_score < 0.3 else ('medium' if fraud_score < 0.7 else 'high')
        recommendation = 'allow' if fraud_score < 0.7 else 'review'

        # Calculate response time
        response_time = (datetime.now() - start_time).total_seconds() * 1000

        return jsonify({
            'success': True,
            'fraud_score': round(fraud_score, 2),
            'risk_level': risk_level,
            'recommendation': recommendation,
            'response_time_ms': round(response_time, 2),
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f'Error scoring bid: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/score-user', methods=['POST'])
def score_user():
    """
    Score user for fraud likelihood
    """
    try:
        data = request.json
        
        if 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400

        user_id = data['user_id']
        
        # Generate user features
        features = {
            'bid_frequency': data.get('bid_frequency', np.random.random()),
            'bid_pattern': data.get('bid_pattern', np.random.random()),
            'account_age': data.get('account_age', 0.5),
            'device_consistency': data.get('device_consistency', 0.5),
            'temporal_pattern': data.get('temporal_pattern', np.random.random()),
            'auction_context': data.get('auction_context', 0.5)
        }
        
        fraud_score = MODEL.predict(features)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'fraud_score': round(fraud_score, 2),
            'risk_level': 'low' if fraud_score < 0.3 else ('medium' if fraud_score < 0.7 else 'high')
        }), 200

    except Exception as e:
        logger.error(f'Error scoring user: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    return jsonify({
        'success': True,
        'model': {
            'type': 'Ensemble (Random Forest + Isolation Forest)',
            'version': MODEL.model_version,
            'accuracy': f'{MODEL.accuracy:.2%}',
            'features': len(MODEL.feature_names),
            'feature_names': MODEL.feature_names,
            'response_time_target': '< 100ms',
            'trained_at': datetime.now().isoformat()
        }
    }), 200

@app.route('/api/retrain', methods=['POST'])
def retrain_model():
    """Retrain the model (admin endpoint)"""
    try:
        logger.info('Starting model retraining...')
        MODEL.train()
        MODEL.save_model(MODEL_PATH)
        logger.info('Model retraining completed')
        
        return jsonify({
            'success': True,
            'message': 'Model retraining completed',
            'accuracy': f'{MODEL.accuracy:.2%}'
        }), 200
    except Exception as e:
        logger.error(f'Error retraining model: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def extract_features(user_id, auction_id, bid_amount):
    """
    Extract features for ML model
    In production, these would be queried from the database
    """
    # Simulate feature extraction from user behavior data
    bid_frequency = min(1.0, np.random.normal(0.3, 0.2))  # How often user bids
    bid_pattern = min(1.0, np.random.normal(0.4, 0.25))   # Consistency of bidding patterns
    account_age = min(1.0, np.random.normal(0.5, 0.3))    # Normalized account age in days
    device_consistency = min(1.0, np.random.normal(0.6, 0.25))  # Device/IP consistency
    temporal_pattern = min(1.0, np.random.normal(0.4, 0.3))     # Bidding time patterns
    auction_context = min(1.0, np.random.normal(0.5, 0.25))     # Auction type similarity
    
    features = {
        'bid_frequency': max(0, bid_frequency),
        'bid_pattern': max(0, bid_pattern),
        'account_age': max(0, account_age),
        'device_consistency': max(0, device_consistency),
        'temporal_pattern': max(0, temporal_pattern),
        'auction_context': max(0, auction_context)
    }
    
    return features

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f'Internal server error: {str(error)}')
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    logger.info('Starting V.I.B.E ML Service...')
    logger.info(f'Model Version: {MODEL.model_version}')
    logger.info(f'Model Accuracy: {MODEL.accuracy:.2%}')
    app.run(host='0.0.0.0', port=5000, debug=True)
