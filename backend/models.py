from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    is_blocked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    login_attempts = db.relationship('LoginAttempt', backref='user', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'is_blocked': self.is_blocked,
            'created_at': self.created_at.isoformat()
        }


class LoginAttempt(db.Model):
    __tablename__ = 'login_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    email = db.Column(db.String(120), nullable=False)
    ip_address = db.Column(db.String(50))
    device_info = db.Column(db.Text)
    location = db.Column(db.String(200))
    risk_score = db.Column(db.Float)
    risk_level = db.Column(db.String(20))
    success = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'email': self.email,
            'ip_address': self.ip_address,
            'location': self.location,
            'risk_score': self.risk_score,
            'risk_level': self.risk_level,
            'success': self.success,
            'timestamp': self.timestamp.isoformat()
        }


class OTPVerification(db.Model):
    __tablename__ = 'otp_verifications'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    otp_code = db.Column(db.String(6), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'is_verified': self.is_verified,
            'expires_at': self.expires_at.isoformat(),
            'created_at': self.created_at.isoformat()
        }