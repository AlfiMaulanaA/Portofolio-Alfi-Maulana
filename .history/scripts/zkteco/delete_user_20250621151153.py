#!/usr/bin/env python3
import sys
import json
from zk import ZK

def delete_user(ip, port, uid):
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=5)
        
        # Connect to device
        conn = zk.connect()
        
        # Delete user
        conn.delete_user(uid=int(uid))
        
        # Disconnect
        conn.disconnect()
        
        result = {
            "success": True,
            "message": f"User with UID {uid} deleted successfully"
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
    if len(sys.argv) != 4:
        print(json.dumps({"success": False, "error": "Usage: python delete_user.py <ip> <port> <uid>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    uid = sys.argv[3]
    
    success = delete_user(ip, port, uid)
    sys.exit(0 if success else 1)
