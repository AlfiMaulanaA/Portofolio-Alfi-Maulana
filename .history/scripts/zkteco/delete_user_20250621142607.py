#!/usr/bin/env python3
import sys
import json
from zk import ZK

def delete_user(ip, port, uid):
    try:
        zk = ZK(ip, port=int(port), timeout=5, password=0, force_udp=False, ommit_ping=False)
        conn = zk.connect()
        
        if conn:
            # Delete user
            conn.delete_user(uid=int(uid))
            
            conn.disconnect()
            
            return {
                "success": True,
                "message": f"User with UID {uid} deleted successfully"
            }
        else:
            return {"success": False, "error": "Failed to connect to device"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Missing UID argument"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    uid = sys.argv[3]
    
    result = delete_user(ip, port, uid)
    print(json.dumps(result))
