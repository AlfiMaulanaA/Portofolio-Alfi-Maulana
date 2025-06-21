#!/usr/bin/env python3
import sys
import json
from zk import ZK

def get_users(ip, port):
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=5)
        
        # Connect to device
        conn = zk.connect()
        
        # Get all users
        users = conn.get_users()
        
        user_list = []
        for user in users:
            user_data = {
                "uid": user.uid,
                "name": user.name,
                "user_id": user.user_id,
                "privilege": user.privilege,
                "password": user.password,
                "group_id": user.group_id,
                "card": getattr(user, 'card', 0)
            }
            user_list.append(user_data)
        
        # Disconnect
        conn.disconnect()
        
        result = {
            "success": True,
            "users": user_list,
            "count": len(user_list)
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"success": False, "error": "Usage: python get_users.py <ip> <port>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    
    success = get_users(ip, port)
    sys.exit(0 if success else 1)
