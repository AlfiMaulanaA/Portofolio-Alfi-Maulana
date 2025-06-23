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

def set_password(ip, port, device_password, timeout, uid, user_password):
    try:
        print(f"[INFO] Connecting to ZKTeco device: {ip}:{port}")
        
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=int(device_password) if device_password != 'None' else 0)
        
        # Connect to device
        conn = zk.connect()
        print(f"[SUCCESS] Connected to ZKTeco device successfully")
        
        print(f"[INFO] Setting password for user UID: {uid}")
        
        # Get user first
        users = conn.get_users()
        user = None
        for u in users:
            if u.uid == int(uid):
                user = u
                break
        
        if not user:
            raise Exception(f"User with UID {uid} not found")
        
        # Update user password
        user.password = user_password
        conn.set_user(user)
        
        # Disconnect
        conn.disconnect()
        print(f"[SUCCESS] Password set and connection closed")
        
        result = {
            "success": True,
            "message": f"Password set for user UID {uid}",
            "uid": int(uid)
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        print(f"[ERROR] Error setting password: {str(e)}")
        error_result = {
            "success": False,
            "error": str(e),
            "uid": uid
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) < 7:
        print(json.dumps({"success": False, "error": "Usage: python set_password.py <ip> <port> <device_password> <timeout> <uid> <user_password>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    device_password = sys.argv[3]
    timeout = sys.argv[4]
    uid = sys.argv[5]
    user_password = sys.argv[6]
    
    success = set_password(ip, port, device_password, timeout, uid, user_password)
    sys.exit(0 if success else 1)
