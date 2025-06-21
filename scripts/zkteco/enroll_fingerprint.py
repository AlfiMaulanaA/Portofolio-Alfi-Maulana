#!/usr/bin/env python3
import sys
import json
from zk import ZK

def enroll_fingerprint(ip, port, uid, finger_id=0):
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=5)
        
        # Connect to device
        conn = zk.connect()
        
        # Start fingerprint enrollment
        # Note: This initiates enrollment mode on device
        # User needs to place finger on device scanner
        conn.enroll_user(uid=int(uid), temp_id=int(finger_id))
        
        # Disconnect
        conn.disconnect()
        
        result = {
            "success": True,
            "message": f"Fingerprint enrollment initiated for UID {uid}, finger {finger_id}",
            "instruction": "Please place finger on device scanner to complete enrollment"
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "uid": uid,
            "finger_id": finger_id
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Usage: python enroll_fingerprint.py <ip> <port> <uid> [finger_id]"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    uid = sys.argv[3]
    finger_id = sys.argv[4] if len(sys.argv) > 4 else 0
    
    success = enroll_fingerprint(ip, port, uid, finger_id)
    sys.exit(0 if success else 1)
