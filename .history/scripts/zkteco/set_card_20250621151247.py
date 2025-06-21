#!/usr/bin/env python3
import sys
import json
from zk import ZK

def set_card(ip, port, uid, card_number):
    try:
        # Create ZK instance
        zk = ZK(ip, port=int(port), timeout=5)
        
        # Connect to device
        conn = zk.connect()
        
        # Get existing user
        users = conn.get_users()
        user = None
        for u in users:
            if u.uid == int(uid):
                user = u
                break
        
        if not user:
            raise Exception(f"User with UID {uid} not found")
        
        # Update card number
        user.card = int(card_number)
        conn.set_user(user)
        
        # Disconnect
        conn.disconnect()
        
        result = {
            "success": True,
            "message": f"Card {card_number} assigned to user UID {uid}"
        }
        
        print(json.dumps(result))
        return True
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "uid": uid,
            "card_number": card_number
        }
        print(json.dumps(error_result))
        return False

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(json.dumps({"success": False, "error": "Usage: python set_card.py <ip> <port> <uid> <card_number>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    uid = sys.argv[3]
    card_number = sys.argv[4]
    
    success = set_card(ip, port, uid, card_number)
    sys.exit(0 if success else 1)
