#!/usr/bin/env node
// ...existing code...
const crypto = require("crypto");

const server_application_code = "VCM-BLUMONPAY-STG-MXN-SERVER";
const server_app_key = "zsZjDKh2XvjSfQ72HyDdMIbHhw4cI2";
const unix_timestamp = Math.floor(Date.now() / 1000).toString();
const uniq_token_string = server_app_key + unix_timestamp;
const uniq_token_hash = crypto
  .createHash("sha256")
  .update(uniq_token_string, "utf8")
  .digest("hex");
const tokenString = `${server_application_code};${unix_timestamp};${uniq_token_hash}`;
const token = Buffer.from(tokenString, "utf8").toString("base64");

console.log("Content-Type: application/json\n");
console.log(JSON.stringify({ token }));
// ...existing code...
