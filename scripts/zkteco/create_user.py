#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import os
from zk import ZK
from zk.user import User

# Set UTF-8 encoding for Windows
if os.name == 'nt':  # Windows
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def get_existing_uids(conn):
    """Get all existing UIDs from the device"""
    try:
        users = conn.get_users()
        existing_uids = [user.uid for user in users]
        print(f"[INFO] Found {len(existing_uids)} existing users with UIDs: {existing_uids}")
        return existing_uids
    except Exception as e:
        print(f"[WARNING] Could not get existing users: {str(e)}")
        return []

def find_available_uid(conn, preferred_uid):
    """Find an available UID, starting from preferred_uid"""
    existing_uids = get_existing_uids(conn)
    
    # If preferred UID is available, use it
    if preferred_uid not in existing_uids:
        print(f"[INFO] Preferred UID {preferred_uid} is available")
        return preferred_uid
    
    # Find next available UID
    for uid in range(1, 65535):  # ZKTeco supports UIDs up to 65534
        if uid not in existing_uids:
            print(f"[INFO] UID {preferred_uid} is taken, using available UID {uid}")
            return uid
    
    raise Exception("No available UID found")

def create_user(ip, port, password, timeout, uid, name, user_id, privilege=0, user_password=None):
    try:
        print(f"[INFO] Connecting to ZKTeco device: {ip}:{port}")
        
        # Create ZK instance
        device_password = int(password) if password != 'None' and password.isdigit() else 0
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=device_password)
        
        # Connect to device
        conn = zk.connect()
        print(f"[SUCCESS] Connected to ZKTeco device successfully")
        
        # Find available UID
        preferred_uid = int(uid)
        available_uid = find_available_uid(conn, preferred_uid)
        
        # Ensure all parameters are correct types
        final_uid = int(available_uid)
        final_privilege = int(privilege) if privilege else 0
        final_password = str(user_password) if user_password else ""
        final_name = str(name)[:24]  # ZKTeco name limit is 24 characters
        final_user_id = str(user_id)
        
        print(f"[INFO] Creating user: UID={final_uid}, Name={final_name}, UserID={final_user_id}, Privilege={final_privilege}")
        
        # Create user object with proper data types
        user = User(
            uid=final_uid,
            name=final_name,
            privilege=final_privilege,
            password=final_password,
            group_id="",
            user_id=final_user_id,
            card=0  # Set card to 0 (no card initially)
        )
        
        # Set user to device
        conn.set_user(user)
        print(f"[SUCCESS] User created successfully")
        
        # Disconnect
        conn.disconnect()
        print(f"[SUCCESS] Connection closed")
        
        result = {
            "success": True,
            "message": f"User {final_name} created successfully",
            "user": {
                "uid": final_uid,
                "name": final_name,
                "user_id": final_user_id,
                "privilege": final_privilege,
                "original_uid": int(uid),
                "uid_changed": final_uid != int(uid)
            }
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        print(f"[ERROR] Error creating user: {str(e)}")
        error_result = {
            "success": False,
            "error": str(e),
            "user": {"uid": uid, "name": name},
            "error_type": type(e).__name__
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) < 8:
        print(json.dumps({"success": False, "error": "Usage: python create_user.py <ip> <port> <password> <timeout> <uid> <name> <user_id> [privilege] [user_password]"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    password = sys.argv[3]
    timeout = sys.argv[4]
    uid = sys.argv[5]
    name = sys.argv[6]
    user_id = sys.argv[7]
    privilege = sys.argv[8] if len(sys.argv) > 8 else 0
    user_password = sys.argv[9] if len(sys.argv) > 9 else None
    
    success = create_user(ip, port, password, timeout, uid, name, user_id, privilege, user_password)
    sys.exit(0 if success else 1)
