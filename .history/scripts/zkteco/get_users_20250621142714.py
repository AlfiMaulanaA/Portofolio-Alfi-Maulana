#!/usr/bin/env python3
import sys
import json
from zk import ZK

def get_users(ip, port):
    try:
        zk = ZK(ip, port=int(port), timeout=5, password=0, force_udp=False, ommit_ping=False)
        conn = zk.connect()
        
        if conn:
            users = conn.get_users()
            user_list = []
            
            for user in users:
                user_list.append({
                    "uid": user.uid,
                    "name": user.name,
                    "privilege": user.privilege,
                    "password": user.password,
                    "group_id": user.group_id,
                    "user_id": user.user_id,
                    "card": getattr(user, 'card', None)
                })
            
            conn.disconnect()
            
            return {
                "success": True,
                "users": user_list,
                "count": len(user_list)
            }
        else:
            return {"success": False, "error": "Failed to connect to device"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing IP and port arguments"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    
    result = get_users(ip, port)
    print(json.dumps(result))
