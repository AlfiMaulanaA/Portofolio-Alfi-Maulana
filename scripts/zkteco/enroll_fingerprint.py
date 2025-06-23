#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import os
from zk import ZK

# Set UTF-8 encoding for Windows
if os.name == 'nt':  # Windows
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def enroll_fingerprint(ip, port, password, timeout, uid):
    try:
        print(f"[INFO] Connecting to ZKTeco device: {ip}:{port}")
        
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=int(password) if password != 'None' else 0)
        
        # Connect to device
        conn = zk.connect()
        print(f"[SUCCESS] Connected to ZKTeco device successfully")
        
        print(f"[INFO] Starting fingerprint enrollment for user UID: {uid}")
        
        # Start fingerprint enrollment
        # Note: This initiates the enrollment process on the device
        # The user needs to place their finger on the device scanner
        conn.enroll_user(uid=int(uid))
        
        # Disconnect
        conn.disconnect()
        print(f"[SUCCESS] Fingerprint enrollment initiated and connection closed")
        
        result = {
            "success": True,
            "message": f"Fingerprint enrollment initiated for user UID {uid}. Please place finger on device scanner.",
            "uid": int(uid)
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        print(f"[ERROR] Error enrolling fingerprint: {str(e)}")
        error_result = {
            "success": False,
            "error": str(e),
            "uid": uid
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print(json.dumps({"success": False, "error": "Usage: python enroll_fingerprint.py <ip> <port> <password> <timeout> <uid>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    password = sys.argv[3]
    timeout = sys.argv[4]
    uid = sys.argv[5]
    
    success = enroll_fingerprint(ip, port, password, timeout, uid)
    sys.exit(0 if success else 1)
