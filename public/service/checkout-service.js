const SERVER_APPLICATION_CODE = "VCM-BLUMONPAY-STG-MXN-SERVER";
const SERVER_APP_KEY = "zsZjDKh2XvjSfQ72HyDdMIbHhw4cI2";

// Convierte un buffer binario a una cadena hexadecimal
function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function computeAuthToken() {
  try {
    const unix_timestamp = Math.floor(Date.now() / 1000).toString();
    const uniq_token_string = SERVER_APP_KEY + unix_timestamp;
    const encoder = new TextEncoder();
    const data = encoder.encode(uniq_token_string);

    const cryptoObj = crypto || window.crypto;
    const subtle = cryptoObj.subtle || cryptoObj.webkitSubtle;

    let hashBuffer;
    if (subtle) {
      hashBuffer = await subtle.digest("SHA-256", data);
    } else {
      if (typeof jsSHA === "undefined") {
        throw new Error("jsSHA library is missing for fallback digest.");
      }
      // Fallback using jsSHA library with correct format
      const shaObj = new jsSHA("SHA-256", "ARRAYBUFFER");
      shaObj.update(data.buffer);
      hashBuffer = shaObj.getHash("ARRAYBUFFER");
    }

    const uniq_token_hash = arrayBufferToHex(hashBuffer);
    const tokenString = `${SERVER_APPLICATION_CODE};${unix_timestamp};${uniq_token_hash}`;
    return btoa(tokenString);
  } catch (error) {
    console.error("Error computing auth token:", error);
    throw error;
  }
}

let token;
computeAuthToken().then((token) => {
  token = token;
  console.log("Content-Type: application/json\n");
  console.log(JSON.stringify({ token }));
});

// Refactored initiateCheckout using async/await
async function initiateCheckout() {
  try {
    // ...simulate checkout initiation logic...
    return {}; // simulate a successful checkout initiation
  } catch (error) {
    throw error;
  }
}

let paymentCheckout = new PaymentCheckout.modal({
  client_app_code: SERVER_APPLICATION_CODE, // changed code: use constant instead of string literal
  client_app_key: SERVER_APP_KEY, // changed code: use constant instead of string literal
  locale: "es", // User's preferred language (es, en, pt). English will be used by default.
  env_mode: "stg", // `prod`, `stg`, `local` to change environment. Default is `stg`
  onOpen: function () {
    console.log("modal open");
  },
  onClose: function () {
    console.log("modal closed");
  },
  onResponse: function (response) {
    // The callback to invoke when the Checkout process is completed

    /*
      In Case of an error, this will be the response.
      response = {
        "error": {
          "type": "Server Error",
          "help": "Try Again Later",
          "description": "Sorry, there was a problem loading Checkout."
        }
      }

      When the User completes all the Flow in the Checkout, this will be the response.
      response = {
        "transaction":{
            "status": "success", // success or failure
            "id": "CB-81011", // transaction_id
            "status_detail": 3 // for the status detail please refer to: https://gpvicomm.github.io/api-doc/#status-details
        }
      }
    */
    console.log("modal response");
    document.getElementById("response").innerHTML = JSON.stringify(response);
  },
});

let btnOpenCheckout = document.querySelector(".js-payment-checkout");
btnOpenCheckout.addEventListener("click", async function () {
  // Ensure token is computed before opening modal
  if (!token) {
    try {
      token = await computeAuthToken();
    } catch (error) {
      console.error("Failed to compute auth token:", error);
      return;
    }
  }
  // Validate and log the custom variable from the button's data attribute
  let customVar = this.getAttribute("data-custom");
  if (customVar) {
    console.log("Custom variable:", customVar);
  }
  paymentCheckout.open({
    user_id: "1234",
    user_email: "jhon@doe.com", //optional
    // user_phone: "7777777777", //optional
    order_description: "1 Green Salad",
    order_amount: 1500,
    order_vat: 0,
    order_reference: "#234323411",
    reference: encodeURIComponent(token),
  });
  try {
    const checkoutResponse = await initiateCheckout();
  } catch (error) {
    console.error("Checkout initiation failed:", error);
    document.getElementById("response").innerText =
      "Error initiating checkout. Please try again later.";
  }
});

window.addEventListener("popstate", function () {
  paymentCheckout.close();
});
