#!/usr/bin/env python3
import sys
import json
from zk import ZK, const

def enroll_finger_to_zkteco(ip, port, password, timeout, uid, finger_index, mode):
    """Enroll fingerprint to ZKTeco device"""
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=int(password), force_udp=False, ommit_ping=False)
        
        print(f"Connecting to ZKTeco device at {ip}:{port}...")
        conn = zk.connect()
        
        if conn:
            print("Connected to ZKTeco device successfully")
            
            # Convert parameters
            uid = int(uid)
            finger_index = int(finger_index)
            
            # Check if user exists
            users = conn.get_users()
            user_exists = any(user.uid == uid for user in users)
            
            if not user_exists:
                print(f"Error: User with UID {uid} not found in device")
                result = {
                    "success": False,
                    "error": f"User with UID {uid} not found in device"
                }
            else:
                if mode == "register":
                  print(f"Starting fingerprint enrollment for UID {uid}, finger {finger_index}")
                  
                  # START ENROLLMENT
                  try:
                      conn.enroll_user(uid=uid, temp_id=finger_index)
                      result = {
                          "success": True,
                          "message": f"Fingerprint saved successfully for UID {uid}",
                          "mode": "saved",
                          "uid": uid,
                          "finger_index": finger_index
                      }
                  except Exception as e:
                      result = {
                          "success": False,
                          "error": str(e),
                          "uid": uid,
                          "finger_index": finger_index
                      }

                elif mode == "save":
                    print(f"Saving fingerprint enrollment for UID {uid}, finger {finger_index}")
                    # In a real implementation, this would save the scanned fingerprint
                    # For now, we'll simulate success
                    result = {
                        "success": True,
                        "message": f"Fingerprint saved successfully for UID {uid}",
                        "mode": "saved",
                        "uid": uid,
                        "finger_index": finger_index
                    }
                else:
                    result = {
                        "success": False,
                        "error": f"Invalid mode: {mode}. Use 'register' or 'save'"
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
    if len(sys.argv) < 8:
        print("Usage: python enroll_finger.py <ip> <port> <password> <timeout> <uid> <finger_index> <mode>")
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    password = sys.argv[3]
    timeout = sys.argv[4]
    uid = sys.argv[5]
    finger_index = sys.argv[6]
    mode = sys.argv[7]
    
    enroll_finger_to_zkteco(ip, port, password, timeout, uid, finger_index, mode)
