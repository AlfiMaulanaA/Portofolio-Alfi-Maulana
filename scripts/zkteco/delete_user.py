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

def delete_user(ip, port, password, timeout, uid):
    try:
        print(f"[INFO] Connecting to ZKTeco device: {ip}:{port}")
        
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=int(password) if password != 'None' else 0)
        
        # Connect to device
        conn = zk.connect()
        print(f"[SUCCESS] Connected to ZKTeco device successfully")
        
        print(f"[INFO] Deleting user with UID: {uid}")
        
        # Delete user from device
        conn.delete_user(uid=int(uid))
        
        # Disconnect
        conn.disconnect()
        print(f"[SUCCESS] User deleted and connection closed")
        
        result = {
            "success": True,
            "message": f"User with UID {uid} deleted successfully",
            "uid": int(uid)
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        print(f"[ERROR] Error deleting user: {str(e)}")
        error_result = {
            "success": False,
            "error": str(e),
            "uid": uid
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print(json.dumps({"success": False, "error": "Usage: python delete_user.py <ip> <port> <password> <timeout> <uid>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    password = sys.argv[3]
    timeout = sys.argv[4]
    uid = sys.argv[5]
    
    success = delete_user(ip, port, password, timeout, uid)
    sys.exit(0 if success else 1)
