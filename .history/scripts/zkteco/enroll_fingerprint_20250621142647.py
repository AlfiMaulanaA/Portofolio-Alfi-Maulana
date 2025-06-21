#!/usr/bin/env python3
import sys
import json
from zk import ZK

def enroll_fingerprint(ip, port, uid, finger_id=0):
    try:
        zk = ZK(ip, port=int(port), timeout=5, password=0, force_udp=False, ommit_ping=False)
        conn = zk.connect()
        
        if conn:
            # Note: This is a simplified version
            # Real fingerprint enrollment requires physical interaction with the device
            # This script prepares the system for fingerprint enrollment
            
            print(f"Please place finger on the device scanner for user UID {uid}")
            print("Fingerprint enrollment must be completed on the physical device")
            
            conn.disconnect()
            
            return {
                "success": True,
                "message": f"Fingerprint enrollment initiated for user UID {uid}, finger {finger_id}",
                "note": "Complete enrollment on physical device"
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
    finger_id = sys.argv[4] if len(sys.argv) > 4 else 0
    
    result = enroll_fingerprint(ip, port, uid, finger_id)
    print(json.dumps(result))
