#!/usr/bin/env python3
import sys
import json
from zk import ZK
from zk.user import User

def create_user(ip, port, uid, name, user_id, privilege=0, password=None):
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=5)
        
        # Connect to device
        conn = zk.connect()
        
        # Create user object
        user = User(
            uid=int(uid),
            name=name,
            privilege=int(privilege),
            password=password or '',
            group_id='',
            user_id=user_id
        )
        
        # Set user to device
        conn.set_user(user)
        
        # Disconnect
        conn.disconnect()
        
        result = {
            "success": True,
            "message": f"User {name} created successfully",
            "user": {
                "uid": int(uid),
                "name": name,
                "user_id": user_id,
                "privilege": int(privilege)
            }
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "user": {"uid": uid, "name": name}
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print(json.dumps({"success": False, "error": "Usage: python create_user.py <ip> <port> <uid> <name> <user_id> [privilege] [password]"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    uid = sys.argv[3]
    name = sys.argv[4]
    user_id = sys.argv[5]
    privilege = sys.argv[6] if len(sys.argv) > 6 else 0
    password = sys.argv[7] if len(sys.argv) > 7 else None
    
    success = create_user(ip, port, uid, name, user_id, privilege, password)
    sys.exit(0 if success else 1)
