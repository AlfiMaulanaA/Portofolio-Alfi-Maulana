#!/usr/bin/env python3
import sys
import json
from zk import ZK

def create_user(ip, port, uid, name, user_id, privilege=0, password=None):
    try:
        zk = ZK(ip, port=int(port), timeout=5, password=0, force_udp=False, ommit_ping=False)
        conn = zk.connect()
        
        if conn:
            # Create user
            conn.set_user(uid=int(uid), name=name, privilege=int(privilege), password=password, group_id='', user_id=user_id)
            
            conn.disconnect()
            
            return {
                "success": True,
                "message": f"User {name} created successfully",
                "uid": int(uid),
                "user_id": user_id
            }
        else:
            return {"success": False, "error": "Failed to connect to device"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print(json.dumps({"success": False, "error": "Missing required arguments"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    uid = sys.argv[3]
    name = sys.argv[4]
    user_id = sys.argv[5]
    privilege = sys.argv[6] if len(sys.argv) > 6 else 0
    password = sys.argv[7] if len(sys.argv) > 7 else None
    
    result = create_user(ip, port, uid, name, user_id, privilege, password)
    print(json.dumps(result))
