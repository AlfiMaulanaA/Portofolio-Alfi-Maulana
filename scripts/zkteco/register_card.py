#!/usr/bin/env python3
import sys
import json
from zk import ZK, const

def register_card_to_zkteco(ip, port, password, timeout, uid, card_number):
    """Register card to ZKTeco device"""
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=int(timeout), password=int(password), force_udp=False, ommit_ping=False)
        
        print(f"Connecting to ZKTeco device at {ip}:{port}...")
        conn = zk.connect()
        
        if conn:
            print("Connected to ZKTeco device successfully")
            
            # Convert parameters
            uid = int(uid)
            card_number = str(card_number)
            
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
                # Set card for user
                conn.set_user(
                    uid=uid,
                    name=None,  # Keep existing name
                    privilege=None,  # Keep existing privilege
                    password=None,  # Keep existing password
                    group_id='',
                    user_id=card_number,  # Set card number as user_id
                    card=int(card_number)  # Set card number
                )
                
                print(f"Card registered successfully for UID {uid}: {card_number}")
                
                result = {
                    "success": True,
                    "message": f"Card {card_number} registered successfully for UID {uid}",
                    "uid": uid,
                    "card_number": card_number
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
    if len(sys.argv) < 7:
        print("Usage: python register_card.py <ip> <port> <password> <timeout> <uid> <card_number>")
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    password = sys.argv[3]
    timeout = sys.argv[4]
    uid = sys.argv[5]
    card_number = sys.argv[6]
    
    register_card_to_zkteco(ip, port, password, timeout, uid, card_number)
