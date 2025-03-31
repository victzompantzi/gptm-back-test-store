#!/usr/bin/env python3
import time
import hashlib
import json
from base64 import b64encode

server_application_code = "VCM-BLUMONPAY-STG-MXN-SERVER"
server_app_key = "zsZjDKh2XvjSfQ72HyDdMIbHhw4cI2"
unix_timestamp = str(int(time.time()))
print(unix_timestamp)
uniq_token_string = server_app_key + unix_timestamp
uniq_token_hash = hashlib.sha256(uniq_token_string.encode("utf8")).hexdigest()
string = "%s;%s;%s" % (server_application_code, unix_timestamp, uniq_token_hash)
auth_token = b64encode(string.encode("utf8")).decode("utf8")
print("Content-Type: application/json")
print("")
print(json.dumps({"auth_token": auth_token}))
