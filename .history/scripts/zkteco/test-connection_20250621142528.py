#!/usr/bin/env python3
import sys
import json
from zk import ZK

def test_connection(ip, port):
    try:
        zk = ZK(ip, port=int(port), timeout=5, password=0, force_udp=False, ommit_ping=False)
        conn = zk.connect()
        
        if conn:
            # Get device info
            firmware = conn.get_firmware_version()
            users_count = len(conn.get_users())
            
            conn.disconnect()
            
            return {
                "success": True,
                "message": "Connection successful",
                "firmware": firmware,
                "users_count": users_count
            }
        else:
            return {"success": False, "error": "Failed to connect"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing IP and port arguments"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    
    result = test_connection(ip, port)
    print(json.dumps(result))
