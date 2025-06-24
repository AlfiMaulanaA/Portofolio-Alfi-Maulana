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
        print(f"[INFO] Found {len(existing_uids)} existing users with UIDs: {sorted(existing_uids)}")
        return existing_uids
    except Exception as e:
        print(f"[WARNING] Could not get existing users: {str(e)}")
        return []

def find_next_sequential_uid(conn, preferred_uid):
    """Find the next sequential UID, continuing from the highest existing UID"""
    existing_uids = get_existing_uids(conn)
    
    if not existing_uids:
        # No existing users, start from preferred UID or 1
        next_uid = max(1, preferred_uid)
        print(f"[INFO] No existing users, starting from UID {next_uid}")
        return next_uid
    
    # Get the highest existing UID
    max_existing_uid = max(existing_uids)
    
    # If preferred UID is higher than max existing and available, use it
    if preferred_uid > max_existing_uid and preferred_uid not in existing_uids:
        print(f"[INFO] Using preferred UID {preferred_uid} (higher than max existing {max_existing_uid})")
        return preferred_uid
    
    # Otherwise, use next sequential UID after the highest existing
    next_uid = max_existing_uid + 1
    
    # Make sure the next UID is not taken (safety check)
    while next_uid in existing_uids and next_uid < 65535:
        next_uid += 1
    
    if next_uid >= 65535:
        raise Exception("Maximum UID limit reached (65535)")
    
    print(f"[INFO] Using next sequential UID {next_uid} (after max existing {max_existing_uid})")
    return next_uid

def create_user_simple(ip, port, password, timeout, uid, name):
    try:
        print(f"[INFO] Connecting to ZKTeco device: {ip}:{port}")
        
        # Create ZK instance
        device_password = int(password) if password != 'None' and password.isdigit() else 0
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=device_password)
        
        # Connect to device
        conn = zk.connect()
        print(f"[SUCCESS] Connected to ZKTeco device successfully")
        
        # Find next sequential UID
        preferred_uid = int(uid)
        sequential_uid = find_next_sequential_uid(conn, preferred_uid)
        
        # Ensure parameters are correct types
        final_uid = int(sequential_uid)
        final_name = str(name)[:24]  # ZKTeco name limit is 24 characters
        
        print(f"[INFO] Creating simple user: UID={final_uid}, Name={final_name}")
        print(f"[DEBUG] Data types: UID={type(final_uid)}, Name={type(final_name)}")
        
        # Create user object with MINIMAL parameters only
        # Only UID and Name - no other potentially problematic fields
        user = User(
            uid=final_uid,    # int - required
            name=final_name   # str - required
        )
        
        print(f"[DEBUG] Simple user object created successfully")
        
        # Set user to device
        conn.set_user(user)
        print(f"[SUCCESS] Simple user created successfully with UID {final_uid}")
        
        # Verify user was created by getting it back
        try:
            created_user = conn.get_user(uid=final_uid)
            if created_user:
                print(f"[VERIFY] User verified on device:")
                print(f"[VERIFY] - UID: {created_user.uid}")
                print(f"[VERIFY] - Name: {created_user.name}")
                print(f"[VERIFY] - Privilege: {created_user.privilege}")
                print(f"[VERIFY] - User ID: {created_user.user_id}")
            else:
                print(f"[WARNING] Could not verify user creation")
        except Exception as verify_error:
            print(f"[WARNING] Could not verify user creation: {str(verify_error)}")
        
        # Disconnect
        conn.disconnect()
        print(f"[SUCCESS] Connection closed")
        
        result = {
            "success": True,
            "message": f"Simple user {final_name} created successfully",
            "user": {
                "uid": final_uid,
                "name": final_name,
                "original_uid": int(uid),
                "uid_changed": final_uid != int(uid)
            }
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        print(f"[ERROR] Error creating simple user: {str(e)}")
        print(f"[ERROR] Error type: {type(e).__name__}")
        
        # More detailed error information
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        
        error_result = {
            "success": False,
            "error": str(e),
            "user": {"uid": uid, "name": name},
            "error_type": type(e).__name__,
            "details": {
                "final_uid": final_uid if 'final_uid' in locals() else None,
                "final_name": final_name if 'final_name' in locals() else None
            }
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) < 7:
        print(json.dumps({"success": False, "error": "Usage: python create_user_simple.py <ip> <port> <password> <timeout> <uid> <name>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    password = sys.argv[3]
    timeout = sys.argv[4]
    uid = sys.argv[5]
    name = sys.argv[6]
    
    print(f"[DEBUG] Simple user creation - Input arguments:")
    print(f"[DEBUG] IP: {ip}, Port: {port}, Password: {password}, Timeout: {timeout}")
    print(f"[DEBUG] UID: {uid} ({type(uid)}), Name: {name} ({type(name)})")
    
    success = create_user_simple(ip, port, password, timeout, uid, name)
    sys.exit(0 if success else 1)
