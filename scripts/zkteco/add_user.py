#!/usr/bin/env python3
import sys
import json
from zk import ZK, const

def add_user_to_zkteco(ip, port, password, timeout, uid, username, user_password=""):
    """Add a user to ZKTeco device"""
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=int(password), force_udp=False, ommit_ping=False)
        
        conn = zk.connect()
        
        if conn:
            
            # Convert UID to integer
            uid = int(uid)
            
            # Check if UID already exists
            existing_users = conn.get_users()
            existing_uids = [user.uid for user in existing_users]
            
            if uid in existing_uids:
                print(f"Warning: UID {uid} already exists, finding next available UID")
                # Find next available UID
                max_uid = max(existing_uids) if existing_uids else 0
                uid = max_uid + 1
                
            
            # Create user
            conn.set_user(
                uid=uid,
                name=username,
                privilege=const.USER_DEFAULT,  # Regular user privilege
                password=user_password if user_password else "",
                group_id='',
                user_id=str(uid)
            )
            
            
            result = {
                "success": True,
                "message": f"User {username} added successfully",
                "user": {
                    "uid": uid,
                    "name": username,
                    "user_id": str(uid)
                }
            }
            
            conn.disconnect()
            
        else:
            
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
    if len(sys.argv) < 7:
        print("Usage: python add_user.py <ip> <port> <password> <timeout> <uid> <username> [user_password]")
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    password = sys.argv[3]
    timeout = sys.argv[4]
    uid = sys.argv[5]
    username = sys.argv[6]
    user_password = sys.argv[7] if len(sys.argv) > 7 else ""
    
    add_user_to_zkteco(ip, port, password, timeout, uid, username, user_password)
