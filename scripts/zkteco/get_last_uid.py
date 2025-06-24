#!/usr/bin/env python3
import sys
import json
from zk import ZK, const

def get_last_uid_from_zkteco(ip, port, password, timeout):
    """Get the last/highest UID from ZKTeco device"""
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=int(password), force_udp=False, ommit_ping=False)
        
        print(f"Connecting to ZKTeco device at {ip}:{port}...")
        conn = zk.connect()
        
        if conn:
            print("Connected to ZKTeco device successfully")
            
            # Get all users
            users = conn.get_users()
            
            if users:
                # Find the highest UID
                max_uid = max(user.uid for user in users)
                user_count = len(users)
                
                print(f"Found {user_count} users, highest UID: {max_uid}")
                
                result = {
                    "success": True,
                    "last_uid": max_uid,
                    "next_uid": max_uid + 1,
                    "user_count": user_count,
                    "users": [{"uid": user.uid, "name": user.name} for user in users]
                }
            else:
                print("No users found in device")
                result = {
                    "success": True,
                    "last_uid": 0,
                    "next_uid": 1,
                    "user_count": 0,
                    "users": []
                }
            
            conn.disconnect()
            print("Disconnected from ZKTeco device")
            
        else:
            print("Failed to connect to ZKTeco device")
            result = {
                "success": False,
                "error": "Failed to connect to ZKTeco device"
            }
            
    except Exception as e:
        print(f"Error: {str(e)}")
        result = {
            "success": False,
            "error": str(e)
        }
    
    # Print result as JSON for Node.js to parse
    print(json.dumps(result))
    return result

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python get_last_uid.py <ip> <port> <password> <timeout>")
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    password = sys.argv[3]
    timeout = sys.argv[4]
    
    get_last_uid_from_zkteco(ip, port, password, timeout)
