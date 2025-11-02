from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, LoginAttempt, OTPVerification
from risk_engine import RiskEngine
from datetime import datetime, timedelta
import jwt
import random
import json
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'

CORS(app)
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

def generate_token(user_id, email):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def generate_otp():
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Backend is running'})

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        name = data.get('name')
        phone = data.get('phone', '')
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        device_info = request.headers.get('User-Agent', 'Unknown')
        
        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400
        
        # Calculate risk score
        risk_data = RiskEngine.calculate_risk_score(email, ip_address, device_info)
        
        # Log registration attempt
        attempt = LoginAttempt(
            email=email,
            ip_address=ip_address,
            device_info=device_info,
            location=json.dumps(risk_data['location']),
            risk_score=risk_data['risk_score'],
            risk_level=risk_data['risk_level'],
            success=False
        )
        db.session.add(attempt)
        
        # Block high-risk registrations
        if risk_data['risk_level'] == 'HIGH':
            db.session.commit()
            return jsonify({
                'error': 'Registration blocked due to high risk',
                'risk_level': 'HIGH'
            }), 403
        
        # Create user
        user = User(email=email, name=name, phone=phone)
        db.session.add(user)
        db.session.commit()
        
        # Update attempt with user_id
        attempt.user_id = user.id
        attempt.success = True
        db.session.commit()
        
        # Generate token
        token = generate_token(user.id, user.email)
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict(),
            'token': token,
            'risk_data': risk_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login/check', methods=['POST'])
def login_check():
    try:
        data = request.json
        email = data.get('email')
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        device_info = request.headers.get('User-Agent', 'Unknown')
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.is_blocked:
            return jsonify({'error': 'User account is blocked'}), 403
        
        # Calculate risk score
        risk_data = RiskEngine.calculate_risk_score(email, ip_address, device_info, user)
        
        # Log login attempt
        attempt = LoginAttempt(
            user_id=user.id,
            email=email,
            ip_address=ip_address,
            device_info=device_info,
            location=json.dumps(risk_data['location']),
            risk_score=risk_data['risk_score'],
            risk_level=risk_data['risk_level'],
            success=False
        )
        db.session.add(attempt)
        db.session.commit()
        
        # Determine authentication flow
        auth_flow = RiskEngine.determine_authentication_flow(risk_data['risk_level'])
        
        response_data = {
            'auth_flow': auth_flow,
            'risk_data': risk_data,
            'attempt_id': attempt.id
        }
        
        # Generate OTP for medium risk
        if auth_flow == 'otp_verification':
            otp_code = generate_otp()
            otp = OTPVerification(
                email=email,
                otp_code=otp_code,
                expires_at=datetime.utcnow() + timedelta(minutes=10)
            )
            db.session.add(otp)
            db.session.commit()
            
            response_data['otp_code'] = otp_code  # In production, send via SMS/email
            response_data['message'] = f'OTP sent to your registered contact. Demo OTP: {otp_code}'
        
        # Block high risk
        if auth_flow == 'blocked':
            return jsonify({
                'error': 'Login blocked due to suspicious activity',
                'risk_data': risk_data
            }), 403
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login/passwordless', methods=['POST'])
def passwordless_login():
    try:
        data = request.json
        email = data.get('email')
        attempt_id = data.get('attempt_id')
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update attempt
        attempt = LoginAttempt.query.get(attempt_id)
        if attempt:
            attempt.success = True
            db.session.commit()
        
        # Generate token
        token = generate_token(user.id, user.email)
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        email = data.get('email')
        otp_code = data.get('otp_code')
        attempt_id = data.get('attempt_id')
        
        # Verify OTP
        otp = OTPVerification.query.filter_by(
            email=email,
            otp_code=otp_code,
            is_verified=False
        ).order_by(OTPVerification.created_at.desc()).first()
        
        if not otp:
            return jsonify({'error': 'Invalid OTP'}), 400
        
        if otp.expires_at < datetime.utcnow():
            return jsonify({'error': 'OTP expired'}), 400
        
        # Mark OTP as verified
        otp.is_verified = True
        
        # Update attempt
        attempt = LoginAttempt.query.get(attempt_id)
        if attempt:
            attempt.success = True
        
        db.session.commit()
        
        # Get user and generate token
        user = User.query.filter_by(email=email).first()
        token = generate_token(user.id, user.email)
        
        return jsonify({
            'message': 'OTP verified successfully',
            'user': user.to_dict(),
            'token': token
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    try:
        total_users = User.query.count()
        total_attempts = LoginAttempt.query.count()
        blocked_users = User.query.filter_by(is_blocked=True).count()
        
        # Risk level distribution
        risk_distribution = {
            'LOW': LoginAttempt.query.filter_by(risk_level='LOW').count(),
            'MEDIUM': LoginAttempt.query.filter_by(risk_level='MEDIUM').count(),
            'HIGH': LoginAttempt.query.filter_by(risk_level='HIGH').count()
        }
        
        # Recent attempts
        recent_attempts = LoginAttempt.query.order_by(
            LoginAttempt.timestamp.desc()
        ).limit(10).all()
        
        return jsonify({
            'total_users': total_users,
            'total_attempts': total_attempts,
            'blocked_users': blocked_users,
            'risk_distribution': risk_distribution,
            'recent_attempts': [attempt.to_dict() for attempt in recent_attempts]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/attempts', methods=['GET'])
def get_all_attempts():
    try:
        attempts = LoginAttempt.query.order_by(
            LoginAttempt.timestamp.desc()
        ).limit(50).all()
        
        return jsonify({
            'attempts': [attempt.to_dict() for attempt in attempts]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)