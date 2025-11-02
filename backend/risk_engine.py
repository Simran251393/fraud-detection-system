import requests
from datetime import datetime, timedelta
from models import LoginAttempt, User, db

class RiskEngine:
    # Risk thresholds
    LOW_RISK_THRESHOLD = 30
    MEDIUM_RISK_THRESHOLD = 60
    
    @staticmethod
    def get_location_from_ip(ip_address):
        """Get location details from IP address using ipapi.co"""
        try:
            if ip_address in ['127.0.0.1', 'localhost']:
                return {'country': 'Local', 'city': 'Development', 'region': 'Dev'}
            
            response = requests.get(f'https://ipapi.co/{ip_address}/json/', timeout=3)
            if response.status_code == 200:
                data = response.json()
                return {
                    'country': data.get('country_name', 'Unknown'),
                    'city': data.get('city', 'Unknown'),
                    'region': data.get('region', 'Unknown')
                }
        except:
            pass
        return {'country': 'Unknown', 'city': 'Unknown', 'region': 'Unknown'}
    
    @staticmethod
    def calculate_risk_score(email, ip_address, device_info, user=None):
        """Calculate risk score based on multiple factors"""
        risk_score = 0
        factors = []
        
        # Factor 1: Check login frequency (30 points)
        recent_attempts = LoginAttempt.query.filter(
            LoginAttempt.email == email,
            LoginAttempt.timestamp > datetime.utcnow() - timedelta(hours=1)
        ).count()
        
        if recent_attempts > 5:
            risk_score += 30
            factors.append("High frequency login attempts")
        elif recent_attempts > 3:
            risk_score += 15
            factors.append("Moderate frequency login attempts")
        
        # Factor 2: Check failed attempts (25 points)
        failed_attempts = LoginAttempt.query.filter(
            LoginAttempt.email == email,
            LoginAttempt.success == False,
            LoginAttempt.timestamp > datetime.utcnow() - timedelta(hours=24)
        ).count()
        
        if failed_attempts > 3:
            risk_score += 25
            factors.append("Multiple failed login attempts")
        elif failed_attempts > 1:
            risk_score += 10
            factors.append("Some failed login attempts")
        
        # Factor 3: New device detection (20 points)
        if user:
            previous_devices = LoginAttempt.query.filter(
                LoginAttempt.user_id == user.id,
                LoginAttempt.success == True
            ).all()
            
            device_fingerprints = [attempt.device_info for attempt in previous_devices]
            if device_info not in device_fingerprints:
                risk_score += 20
                factors.append("New device detected")
        
        # Factor 4: Location check (25 points)
        location_data = RiskEngine.get_location_from_ip(ip_address)
        
        if user:
            # Check for location changes
            last_successful = LoginAttempt.query.filter(
                LoginAttempt.user_id == user.id,
                LoginAttempt.success == True
            ).order_by(LoginAttempt.timestamp.desc()).first()
            
            if last_successful and last_successful.location:
                import json
                try:
                    last_location = json.loads(last_successful.location)
                    if last_location.get('country') != location_data.get('country'):
                        risk_score += 25
                        factors.append("Location change detected")
                    elif last_location.get('city') != location_data.get('city'):
                        risk_score += 10
                        factors.append("City change detected")
                except:
                    pass
        
        # Determine risk level
        if risk_score < RiskEngine.LOW_RISK_THRESHOLD:
            risk_level = "LOW"
        elif risk_score < RiskEngine.MEDIUM_RISK_THRESHOLD:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        return {
            'risk_score': min(risk_score, 100),
            'risk_level': risk_level,
            'factors': factors,
            'location': location_data
        }
    
    @staticmethod
    def determine_authentication_flow(risk_level):
        """Determine authentication method based on risk level"""
        flows = {
            'LOW': 'passwordless',
            'MEDIUM': 'otp_verification',
            'HIGH': 'blocked'
        }
        return flows.get(risk_level, 'otp_verification')