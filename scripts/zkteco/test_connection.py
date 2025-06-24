#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import os
from zk import ZK

# Set UTF-8 encoding for Windows
if os.name == 'nt':  # Windows
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def test_connection(ip, port, password, timeout):
    try:
        print(f"[INFO] Testing connection to ZKTeco device: {ip}:{port}")
        print(f"[INFO] Device password: {password}, Timeout: {timeout}s")
        
        # Create ZK instance
        device_password = int(password) if password != 'None' and password.isdigit() else 0
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=device_password)
        
        print(f"[INFO] ZK instance created successfully")
        
        # Connect to device
        conn = zk.connect()
        print(f"[SUCCESS] Connected to ZKTeco device successfully")
        
        # Get device info
        try:
            firmware_version = conn.get_firmware_version()
            print(f"[INFO] Firmware version: {firmware_version}")
        except Exception as e:
            print(f"[WARNING] Could not get firmware version: {str(e)}")
            firmware_version = "Unknown"
        
        # Get user count
        try:
            users = conn.get_users()
            user_count = len(users)
            print(f"[INFO] Total users on device: {user_count}")
        except Exception as e:
            print(f"[WARNING] Could not get user count: {str(e)}")
            user_count = 0
        
        # Get device time
        try:
            device_time = conn.get_time()
            print(f"[INFO] Device time: {device_time}")
        except Exception as e:
            print(f"[WARNING] Could not get device time: {str(e)}")
            device_time = "Unknown"
        
        # Disconnect
        conn.disconnect()
        print(f"[SUCCESS] Connection closed successfully")
        
        result = {
            "success": True,
            "message": "Connection test successful",
            "device_info": {
                "ip": ip,
                "port": int(port),
                "firmware_version": firmware_version,
                "user_count": user_count,
                "device_time": str(device_time),
                "connection_time": timeout
            }
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        print(f"[ERROR] Connection test failed: {str(e)}")
        error_result = {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "device_info": {
                "ip": ip,
                "port": int(port),
                "attempted_password": password,
                "timeout": int(timeout)
            }
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(json.dumps({"success": False, "error": "Usage: python test_connection.py <ip> <port> <password> <timeout>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    password = sys.argv[3]
    timeout = sys.argv[4]
    
    success = test_connection(ip, port, password, timeout)
    sys.exit(0 if success else 1)
