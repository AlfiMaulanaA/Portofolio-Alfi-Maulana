#!/usr/bin/env python3
import sys
import json
from zk import ZK

def test_connection(ip, port):
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=5, password=0, force_udp=False, ommit_ping=False)
        
        # Connect to device
        conn = zk.connect()
        
        # Get device info
        firmware_version = conn.get_firmware_version()
        serialnumber = conn.get_serialnumber()
        platform = conn.get_platform()
        device_name = conn.get_device_name()
        
        # Get user count
        users = conn.get_users()
        user_count = len(users)
        
        # Get attendance count
        attendances = conn.get_attendance()
        attendance_count = len(attendances)
        
        # Disconnect
        conn.disconnect()
        
        result = {
            "success": True,
            "device_info": {
                "ip": ip,
                "port": port,
                "firmware": firmware_version,
                "serial": serialnumber,
                "platform": platform,
                "name": device_name,
                "users": user_count,
                "attendances": attendance_count
            }
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "device": f"{ip}:{port}"
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"success": False, "error": "Usage: python test_connection.py <ip> <port>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    
    success = test_connection(ip, port)
    sys.exit(0 if success else 1)
