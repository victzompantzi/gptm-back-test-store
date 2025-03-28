import time
import hashlib
from base64 import b64encode

print("#########################################################")
print("####### AUTH TOKEN TEST")
print("#########################################################")
server_application_code = "VCM-BLUMONPAY-STG-MXN-SERVER"
server_app_key = "zsZjDKh2XvjSfQ72HyDdMIbHhw4cI2"
unix_timestamp = str(int(time.time()))
print("UNIX TIMESTAMP: %s" % unix_timestamp)
uniq_token_string = server_app_key + unix_timestamp
print("UNIQ STRING: %s" % uniq_token_string)
uniq_token_hash = hashlib.sha256(uniq_token_string.encode("utf8")).hexdigest()
print("UNIQ HASH: %s" % uniq_token_hash)
string = "%s;%s;%s" % (server_application_code, unix_timestamp, uniq_token_hash)
auth_token = b64encode(string.encode("utf8"))
print("AUTH TOKEN: %s" % auth_token)
