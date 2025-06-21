#!/usr/bin/env python3
import sys
import json
from zk import ZK

def set_card(ip, port, uid, card_number):
    try:
        zk = ZK(ip, port=int(port), timeout=5, password=0, force_udp=False, ommit_ping=False)
        conn = zk.connect()
        
        if conn:
            # Get existing user
            users = conn.get_users()
            user = next((u for u in users if u.uid == int(uid)), None)
            
            if user:
                # Update user with card number
                conn.set_user(uid=int(uid), name=user.name, privilege=user.privilege, password=user.password, group_id=user.group_id, user_id=user.user_id, card=int(card_number))
                
                conn.disconnect()
                
                return {
                    "success": True,
                    "message": f"Card {card_number} assigned to user UID {uid}"
                }
            else:
                conn.disconnect()
                return {"success": False, "error": f"User with UID {uid} not found"}
        else:
            return {"success": False, "error": "Failed to connect to device"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(json.dumps({"success": False, "error": "Missing UID and card number arguments"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    uid = sys.argv[3]
    card_number = sys.argv[4]
    
    result = set_card(ip, port, uid, card_number)
    print(json.dumps(result))
