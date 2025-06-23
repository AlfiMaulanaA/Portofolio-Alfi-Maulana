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

def get_users(ip, port, password, timeout):
    try:
        print(f"[INFO] Connecting to ZKTeco device: {ip}:{port}")
        
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=int(password) if password != 'None' else 0)
        
        # Connect to device
        conn = zk.connect()
        print(f"[SUCCESS] Connected to ZKTeco device successfully")
        
        print(f"[INFO] Retrieving users from device")
        
        # Get all users
        users = conn.get_users()
        
        # Convert users to JSON serializable format
        users_list = []
        for user in users:
            users_list.append({
                "uid": user.uid,
                "name": user.name,
                "user_id": user.user_id,
                "privilege": user.privilege,
                "password": user.password,
                "group_id": user.group_id,
                "card": user.card
            })
        
        # Disconnect
        conn.disconnect()
        print(f"[SUCCESS] Retrieved {len(users_list)} users and connection closed")
        
        result = {
            "success": True,
            "message": f"Retrieved {len(users_list)} users",
            "users": users_list,
            "count": len(users_list)
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        print(f"[ERROR] Error retrieving users: {str(e)}")
        error_result = {
            "success": False,
            "error": str(e),
            "users": [],
            "count": 0
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(json.dumps({"success": False, "error": "Usage: python get_users.py <ip> <port> <password> <timeout>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    password = sys.argv[3]
    timeout = sys.argv[4]
    
    success = get_users(ip, port, password, timeout)
    sys.exit(0 if success else 1)
