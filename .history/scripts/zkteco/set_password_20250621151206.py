#!/usr/bin/env python3
import sys
import json
from zk import ZK

def set_password(ip, port, uid, password):
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=5)
        
        # Connect to device
        conn = zk.connect()
        
        # Get existing user
        users = conn.get_users()
        user = None
        for u in users:
            if u.uid == int(uid):
                user = u
                break
        
        if not user:
            raise Exception(f"User with UID {uid} not found")
        
        # Update password
        user.password = password
        conn.set_user(user)
        
        # Disconnect
        conn.disconnect()
        
        result = {
            "success": True,
            "message": f"Password set for user UID {uid}"
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "uid": uid
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(json.dumps({"success": False, "error": "Usage: python set_password.py <ip> <port> <uid> <password>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    uid = sys.argv[3]
    password = sys.argv[4]
    
    success = set_password(ip, port, uid, password)
    sys.exit(0 if success else 1)
