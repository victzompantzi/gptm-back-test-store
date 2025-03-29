let paymentCheckout = new PaymentCheckout.modal({
    env_mode: 'stg', // `prod`, `stg`: to change environment. Default is `stg`
    onOpen: function () {
      console.log('modal open');
    },
    onClose: function () {
      console.log('modal closed');
    },
    onResponse: function (response) { // The callback to invoke when the Checkout process is completed

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
              "id": "PR-10002", // transaction_id
              "status_detail": 3 // for the status detail please refer to: https://developers.gpvicomm.com/api/#detalle-de-los-estados
          }
        }
      */
      console.log('modal response');
      document.getElementById('response').innerHTML = JSON.stringify(response);
    }
  });

  let btnOpenCheckout = document.querySelector('.js-payment-checkout');
  btnOpenCheckout.addEventListener('click', function () {
    paymentCheckout.open({
      reference: '8REV4qMyQP3w4xGmANA' // reference received for Payment Gateway
    });
  });

  window.addEventListener('popstate', function () {
    paymentCheckout.close();
  });