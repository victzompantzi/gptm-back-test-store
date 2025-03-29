(function ($) {
  $(document).ready(function () {
    var $loading = $("#loadingDiv").hide();
    $(document)
      .ajaxStart(function () {
        $loading.show();
        //checkSession();
      })
      .ajaxStop(function () {
        $loading.hide();
      });

    $carrito = $("#carritoFlag").val();
    if ($carrito == "activo") {
      $(".btnCarrito").addClass("active");
    } else {
      $(".btnCarrito").removeClass("active");
    }

    var $today = new Date();
    // var $time = $today.getHours();
    // $(".greetings").removeClass("active");

    // if ($time < 12) {
    //   $(".greetings.dia").addClass("active");
    // } else if ($time >= 12 && $time < 18) {
    //   $(".greetings.tarde").addClass("active");
    // } else {
    //   $(".greetings.noche").addClass("active");
    // }

    $(".closeModal").click(function () {
      $(".modalWarning").removeClass("active");
    });
    var $bookingReserva = $("#holderReservation");
    if ($bookingReserva.length) {
      var scrollfooter =
        document.getElementById("footerBoat").getBoundingClientRect().top +
        window.scrollY;
      //console.log("scroll scrollfooter: " + scrollfooter);
      $(window).scroll(function () {
        var scroll = $(window).scrollTop();
        //console.log("scroll ACTUALO: " + scroll);

        if (scroll >= 50 && scroll < scrollfooter - 910) {
          $("#holderReservation").addClass("stickybook");
        } else if (scroll < 210) {
          $("#holderReservation").removeClass("stickybook");
        } else if (scroll >= scrollfooter - 910) {
          $("#holderReservation").removeClass("stickybook");
        }
      });
    }

    var $booking = $("#bookingMaskPosition");
    if ($booking.length) {
      getCategorias();
    }
    var $bookingLocal = $("#bookingMaskPositionLocal");
    if ($bookingLocal.length) {
      getCategoriasLocales();
    }
    if ($booking.length || $bookingLocal.length) {
      $servertime = $("#servertime").val();
      $servertimefin = $("#servertimefin").val();
      $start = moment($servertime);
      $end = moment($servertimefin);
      $("#departure").val(moment($start).format("YYYY-MM-DD"));
      $("#arrival").val(moment($end).format("YYYY-MM-DD"));
      $(".btnSearch").click(() => {
        $("#bookingMsg").slideUp();
        let $pax = Number($("#pasajeros").val());
        let muelle = Number($("#puerto_id").val());
        if ($pax > 0 && muelle > 0) {
          $("#formBooking").submit();
        } else {
          if (muelle == 0) {
            $("#amletBookingMask select").addClass("error");
          } else {
            $("#bookingMsg").slideDown();
          }
        }
      });
      var fechaFinal;
      let $locale = $("#locale").val();
      $maxDate = $("#maxdate").val();
      activarDates($locale, "daterange", "redondo", $maxDate, "0");

      // fetch('/wp-json/horariosWinjet/horarios.xml')
      //   .then(response => {
      //     if (!response.ok) {
      //       throw new Error('Error en la red: ' + response.statusText);
      //     }
      //     return response.text();
      //   })
      //   .then(data => {
      //     const parser = new DOMParser();
      //     const xmlDoc = parser.parseFromString(data, 'application/xml');

      //     // Obtener todos los elementos <fecha>
      //     const elements = xmlDoc.getElementsByTagName('fecha');

      //     // Extraer y mostrar la primera fecha
      //     if (elements.length > 0) {
      //       const lastElement = elements[elements.length - 1];
      //       const textContent = lastElement.textContent.trim();
      //       fechaFinal = textContent.split('\n')[0].trim();
      //       $("#maxdate").val(fechaFinal);
      //       let $locale = $("#locale").val();
      //       activarDates($locale, "daterange","redondo", fechaFinal, "0")

      //     } else {
      //       console.log("No se encontraron elementos <fecha>.");
      //     }
      //   })
      //   .catch(error => console.error('Error:', error));
    } //End booking.lenght

    var $confirmaProsa = $("#confirmaResponseProsa");
    if ($confirmaProsa.length) {
      setTimeout(procesarCompra, 5500);
    }

    //var fechaFinal = "";
    // $size = $('body').hasClass("mobileSize") ? "down" : "up";
    // let $locale = $("#locale").val();
    // fetch('wp-json/horariosWinjet/horarios.xml')
    //   .then(response => {
    //     if (!response.ok) {
    //       throw new Error('Error en la red: ' + response.statusText);
    //     }
    //     return response.text();
    //   })
    //   .then(data => {
    //     const parser = new DOMParser();
    //     const xmlDoc = parser.parseFromString(data, 'application/xml');

    //     // Obtener todos los elementos <fecha>
    //     const elements = xmlDoc.getElementsByTagName('fecha');

    //     // Extraer y mostrar la primera fecha
    //     if (elements.length > 0) {
    //       const lastElement = elements[elements.length - 1];
    //       const textContent = lastElement.textContent.trim();
    //       fechaFinal = textContent.split('\n')[0].trim();
    //       console.log(fechaFinal)
    //       $("#maxdate").val(fechaFinal);
    //       console.log("before 113");
    //       activarDates($locale, "daterange","redondo", fechaFinal)
    //       // $servertime = $("#servertime").val();
    //       // $servertimefin = $("#servertimefin").val();
    //       // $start = moment($servertime);
    //       // $end = moment($servertimefin);
    //       // console.log("start2: " + $start + " end: " + $end);
    //       // $('input[name="daterange"]').daterangepicker(
    //       //   {
    //       //     locale: {
    //       //       format: "YYYY-MM-DD",
    //       //     },
    //       //     autoApply: true,
    //       //     minDate: $start,
    //       //     maxDate: moment(fechaFinal, 'DD-MM-YYYY'),
    //       //     parentEl: "#dates",
    //       //     drops: $size,
    //       //   },
    //       //   function (start, end, label) {
    //       //     $("#departure").val( start.format('YYYY-MM-DD') );
    //       //     $("#arrival").val(end.format("YYYY-MM-DD"));
    //       //     // $("#departure").val("");
    //       //     // $("#arrival").val("");
    //       //   }
    //       // );

    //     } else {
    //       console.log("No se encontraron elementos <fecha>.");
    //     }
    //   })
    //   .catch(error => console.error('Error:', error));

    $('input[name="daterange"]').val("");
    $("#formBooking").on("submit", function (event) {
      const checboxAbierto = $(".form-check-input").is(":checked");
      if (!checboxAbierto && !$('input[name="daterange"]').val()) {
        event.preventDefault(); // Prevenir el envío del formulario
      }
    });

    //Activar el popup de opcionea a seleccionar
    $(".btnSelect").click(function (e) {
      if ($(this).hasClass("active")) {
        $(this)
          .parent(".bookOption")
          .children(".popUpOptions")
          .removeClass("active");
        $(this).removeClass("active");
      } else {
        $(".btnSelect").removeClass("active");
        $(this).addClass("active");
        $(".popUpOptions").removeClass("active");
        $(this)
          .parent(".bookOption")
          .children(".popUpOptions")
          .addClass("active");
      }
      e.stopPropagation();
    });

    //Selección la opción deseada desde el popup de opciones
    $("#poptravelSelect button").click(function (e) {
      console.log("cambio de tipo viaje: ");
      e.preventDefault();
      $(this)
        .parents(".bookOption")
        .children(".btnSelect")
        .removeClass("active");
      $(this).parent(".popUpOptions").removeClass("active");
      $(".popUpOptions button").removeClass("active");
      $(this).addClass("active");
      $opcion = $(this).val();
      $text = $(this).children("p").html();
      $(this)
        .parents(".bookOption")
        .children(".btnSelect")
        .children("span")
        .text($text);
      let $field = $(this).attr("data-field");
      $("#" + $field).val($opcion);
      let $locale = $("#locale").val();
      $maxDate = $("#maxdate").val();
      console.log("before 113");
      activarDates($locale, "daterange", $opcion, $maxDate, "0");

      if ($opcion == "sencillo") {
        // $size = $('body').hasClass("mobileSize") ? "down" : "up";
        // $('input[name="daterange"]').daterangepicker(
        //   {
        //     locale: {
        //       format: "YYYY-MM-DD",
        //     },
        //     singleMonth: false,
        //     linkedCalendars: true,
        //     singleDatePicker: true,
        //     autoApply: true,
        //     startDate: $start,
        //     minDate: $start,
        //     maxDate: moment(fechaFinal, 'DD-MM-YYYY'),
        //     parentEl: "#dates",
        //     drops: $size,

        //   },
        //   function (start, end, label) {
        //     $("#departure").val(start.format("YYYY-MM-DD"));
        //   }
        // );

        // $("#departure").val(moment().format("YYYY-MM-DD"));
        $(".daterangepicker").addClass("single");
        //$('input[name="daterange"]').val('');
      } else {
        // $size = $('body').hasClass("mobileSize") ? "down" : "up";

        // $('input[name="daterange"]').daterangepicker(
        //   {
        //     locale: {
        //       format: "YYYY-MM-DD",
        //     },
        //     linkedCalendars: true,
        //     singleDatePicker: false,
        //     autoApply: true,
        //     startDate: $start,
        //     endDate: $end,
        //     minDate: $start,
        //     maxDate: moment(fechaFinal, 'DD-MM-YYYY'),
        //     parentEl: "#dates",
        //     drops: $size,
        //   },
        //   function (start, end, label) {
        //     $("#departure").val(start.format("YYYY-MM-DD"));
        //     $("#arrival").val(end.format("YYYY-MM-DD"));
        //   }
        // );
        $(".daterangepicker").removeClass("single");
        // $('input[name="daterange"]').val('');
      }
      e.stopPropagation();
      calcularTotal();
    });

    $(document).on("click", function (e) {
      if ($(e.target).closest(".popUpOptions").length === 0) {
        $(".popUpOptions").removeClass("active");
        $(".btnSelect, .btnSelectPax").removeClass("active");
      }
    });

    $("select[name=origen]").change(function () {
      let $puerto = $(this).val();
      let $puertoDest = $("select[name=origen] option:selected").attr(
        "otherPort"
      );

      $("select[name=destino]").val($puertoDest);
      let $origenMuelle = $("select[name=origen] option:selected").attr(
        "data-nombre"
      );
      let $destinoMuelle = $("select[name=destino] option:selected").attr(
        "data-nombre"
      );
      $("#ruta").val($origenMuelle + " - " + $destinoMuelle);
      $("#puerto_id").val($puerto);
      $("#puerto_retorno").val($puertoDest);
      $("#rutas").addClass("active");
      calcularTotal();
    });

    $("#invertRuta").click(function () {
      let $puertoOrigen = $("select[name=origen] option:selected").attr("port");
      let $puertoDest = $("select[name=origen] option:selected").attr(
        "otherPort"
      );
      $("select[name=origen]").val($puertoDest);
      $("select[name=destino]").val($puertoOrigen);
      let $origenMuelle = $("select[name=origen] option:selected").attr(
        "data-nombre"
      );
      let $destinoMuelle = $("select[name=destino] option:selected").attr(
        "data-nombre"
      );
      $("#ruta").val($origenMuelle + " - " + $destinoMuelle);
      $("#puerto_id").val($puertoDest);
      $("#puerto_retorno").val($puertoOrigen);
      calcularTotal();
    });

    $("#openTicket").change(function () {
      if (this.checked) {
        $("#dates").removeClass("active");
        $("#abierto").val(1);
        $("#tipoTicket").val("abierto");
      } else {
        $("#dates").addClass("active");
        $("#abierto").val(0);
        $("#tipoTicket").val("cerrado");
      }
    });

    /************* -----    VENTA WEB    ------------  *********************/
    /************************************* PARA LA VENTA WEB************************ */
    var $topVenta = $("#wizardHolder");
    if ($topVenta.length) {
      if ($("#wizardHolder").hasClass("es_MX")) {
        var $config = {
          next: "Siguiente",
          previous: "Anterior",
          finish: "Pagar",
        };
      } else {
        var $config = { next: "Next", previous: "Previous", finish: "Pay" };
      }

      $(".btnSelectPax").click(function (e) {
        if ($(this).hasClass("active")) {
          $("#popticketsSelect").removeClass("active");
          $(this).removeClass("active");
        } else {
          $(this).addClass("active");
          $("#popticketsSelect").addClass("active");
        }
        e.stopPropagation();
      });
      let $isPost = $("#isPost").val();
      // if($isPost == "info"){
      var form = $("#formVentaweb").show();
      form
        .steps({
          headerTag: "h3",
          bodyTag: "section",
          transitionEffect: "slideLeft",
          labels: $config,
          onStepChanging: function (event, currentIndex, newIndex) {
            let $abierto = $("#abierto").val();
            // Allways allow previous action even if the current form is not valid!
            if (currentIndex > newIndex) {
              //$(".mensajeHorarioSelect").html("");
              return true;
            }
            if (newIndex == 1) {
              //Validar selección de horario
              let $tipoTicket, $tipoViaje;
              $tipoTicket = $("#tipoTicket").val();
              $tipoViaje = $("#tipoviaje").val();
              if ($tipoTicket == "cerrado") {
                let $horaSalida = $("#horaSalida").val();
                if ($horaSalida == "initial") {
                  let $mensaje =
                    '<p class="error">' +
                    $("#etiquetas").attr("data-mensajeSelecH") +
                    "</p>";
                  $(".mensajeHorario").html($mensaje);
                  return false;
                } else {
                  return true;
                }
              } else {
                // let $horaSalida = $("#horaSalida").val();

                // if ($horaSalida == "0") {
                //   return true;
                // } else {
                //   form.validate().settings.ignore = ":disabled";
                //   return form.valid();
                // }
                // form.validate().settings.ignore = ":disabled";
                // return form.valid();
                return true;
              }
            } else if (newIndex == 2) {
              let $tipoTicket, $tipoViaje;
              $tipoTicket = $("#tipoTicket").val();
              $tipoViaje = $("#tipoviaje").val();
              if ($tipoTicket == "cerrado") {
                if ($tipoViaje == "redondo") {
                  let $horaRegreso = $("#horaRegreso").val();
                  if ($horaRegreso == "initial") {
                    let $mensaje =
                      '<p class="error">' +
                      $("#etiquetas").attr("data-mensajeSelecH") +
                      "</p>";
                    $(".mensajeHorarioR").html($mensaje);
                  } else {
                    return true;
                  }
                } else {
                  form.validate().settings.ignore = ":disabled,:hidden";
                  return form.valid();
                }
              } else {
                return true;
              }
            } else if (newIndex == 3) {
              form.validate().settings.ignore = ":disabled,:hidden";
              return form.valid();
            }
          },
          onFinishing: function (event, currentIndex) {
            form.validate().settings.ignore = ":disabled";
            let $tipoTicket, $tipoViaje;
            $tipoTicket = $("#tipoTicket").val();
            $tipoViaje = $("#tipoviaje").val();
            let $mensaje =
              '<p class="error">' +
              $("#etiquetas").attr("data-mensajeSelecH") +
              "</p>";
            let $move = false;

            if ($tipoTicket == "cerrado") {
              let $horaSalida = $("#horaSalida").val();
              if ($horaSalida == "initial") {
                $(".mensajeHorario").html($mensaje);
                $("#formVentaweb-t-0").click();
                $move = true;
              }
              if ($tipoViaje == "redondo") {
                let $horaRegreso = $("#horaRegreso").val();
                if ($horaRegreso == "initial") {
                  $(".mensajeHorarioR").html($mensaje);
                  if ($move == false) {
                    $("#formVentaweb-t-1").click();
                  }
                }
              }
            }
            let $errors = 0;
            $(".pasajeroName").each(function () {
              if ($(this).hasClass("error")) {
                $errors = $errors + 1;
              }
            });
            if ($errors > 0) {
              if ($move == false) {
                $("#formVentaweb").steps("previous");
              }
            } else {
              if ($move == false) {
                return form.valid();
              }
            }
          },
          onFinished: function (event, currentIndex) {
            let $pax = Number($("#pasajeros").val());
            $("#bookingMsg").slideUp();
            if ($pax > 0) {
              var formulario = $("#formVentaweb");
              formulario.submit();
            } else {
              $("#bookingMsg").slideDown();
            }
          },
        })
        .validate({
          errorPlacement: function errorPlacement(error, element) {
            element.before(error);
          },
        });
      // }

      let $puerto = $("#puerto_id").val();
      let $puertoretorno = $("#puerto_retorno").val();

      let $tipo = $("#tipoviaje").val();
      let $open = $("#abierto").val();
      let $tipoTicket = $("#tipoTicket").val();

      $(".radioOptionViaje").click(function () {
        console.log("option radop");
        let $opcion = $(this).attr("data-value");
        $(".radioOptionViaje").removeClass("active");
        $(this).addClass("active");
        $departure = $("#departure").val();
        $arrival = $("#arrival").val();
        console.log("arrivaaaal " + $arrival);
        if ($arrival == "") {
          $("#arrival").val(
            moment($departure).add(48, "hour").format("YYYY-MM-DD")
          );
          $arrival = moment($departure).add(48, "hour").format("YYYY-MM-DD");
          console.log("undefined " + $arrival);
        }
        let $locale = $("#locale").val();
        $maxDate = $("#maxdate").val();
        console.log("before call line 535 ");
        activarDates($locale, "daterangeventa", $opcion, $maxDate, "1");

        if ($opcion == "sencillo") {
          // $size = $('body').hasClass("mobileSize") ? "down" : "up";
          // $('input[name="daterangeventa"]').daterangepicker(
          //   {
          //     locale: {
          //       format: "YYYY-MM-DD",
          //     },

          //     linkedCalendars: true,
          //     singleDatePicker: true,
          //     autoApply: true,
          //     startDate: $departure,
          //     minDate: moment(),
          //     parentEl: "#dates",
          //     drops: $size,
          //   },
          //   function (start, end, label) {
          //     // $("#departure").val( start.format('YYYY-MM-DD') );
          //     //$("#arrival").val( end.format('YYYY-MM-DD') );
          //   }
          // );

          //$("#departure").val( moment().format('YYYY-MM-DD') );
          $(".daterangepicker").addClass("single");
        } else {
          // $size = $('body').hasClass("mobileSize") ? "down" : "up";
          // $('input[name="daterangeventa"]').daterangepicker(
          //   {
          //     locale: {
          //       format: "YYYY-MM-DD",
          //     },
          //     linkedCalendars: true,
          //     singleDatePicker: false,
          //     autoApply: true,
          //     startDate: $departure,
          //     endDate: $arrival,
          //     minDate: moment(),
          //     parentEl: "#dates",
          //     drops: $size,
          //   },
          //   function (start, end, label) {
          //     //$("#departure").val( start.format('YYYY-MM-DD') );
          //     //$("#arrival").val( end.format('YYYY-MM-DD') );
          //   }
          // );
          $(".daterangepicker").removeClass("single");

          //$("#informacion ul li:nth-child(3)").text($tipo);
          //calcularTotal();
        }
      });
      $(".radioOptionOpen").click(function () {
        let $tipo = $(this).attr("data-value");
        $(".radioOptionOpen").removeClass("active");
        $(this).addClass("active");
        if ($tipo == "abierto") {
          $("#dates").parent(".optionEdit").addClass("inactive");
          $(".optionsWrap .optionEdit:nth-child(5)").addClass("single");
          // $(".rangoLabel").addClass("inactive");
          //$("#abierto").val(1);
        } else {
          $("#dates").parent(".optionEdit").removeClass("inactive");
          $(".optionsWrap .optionEdit:nth-child(5)").removeClass("single");
        }
      });

      /*----------  EDITAR RUTA------------ */
      $("select[name=origenventa]").change(function () {
        let $puertoDest = $("select[name=origenventa] option:selected").attr(
          "otherPort"
        );
        $("select[name=destinoventa]").val($puertoDest);
      });

      $("#invertRutaventa").click(function () {
        let $puertoOrigen = $("select[name=origenventa] option:selected").attr(
          "port"
        );
        let $puertoDest = $("select[name=origenventa] option:selected").attr(
          "otherPort"
        );
        $("select[name=origenventa]").val($puertoDest);
        $("select[name=destinoventa]").val($puertoOrigen);
      });

      if ($tipoTicket == "cerrado") {
        getHorariosPuerto("horariosVentawebDeparture", $puerto, "departure");
        if ($tipo == "redondo") {
          getHorariosPuerto(
            "horariosVentawebRetorno",
            $puertoretorno,
            "retorno"
          );
        }
      }
      $(".btnModificar").click(function () {
        $(".editar").slideDown();
      });

      $(".btnClose").click(function () {
        $(".editar").slideUp();
      });
      $(".btnOkEdit").click(function () {
        actualizarOpciones();
        rewritePasajeros();
        $(".editar").slideUp();
        actualizarSalidas();
      });

      //Cargamos el daterangepicker al cargar la venta web por primera vez
      let $tipoViajeVenta = $("#tipoviaje").val();
      let $tipoTicketVenta = $("#tipoTicket");
      // $departure = $("#departure").val();
      // $arrival = $("#arrival").val();
      let $single;
      if ($tipoViajeVenta == "redondo") {
        $single = false;
      } else {
        $single = true;
      }
      let $locale = $("#locale").val();
      $maxDate = $("#maxdate").val();
      console.log("before call line 655 ");
      activarDates($locale, "daterangeventa", $tipoViajeVenta, $maxDate, "1");

      // $size = $('body').hasClass("mobileSize") ? "down" : "up";

      // $('input[name="daterangeventa"]').daterangepicker(
      //   {
      //     locale: {
      //       format: "YYYY-MM-DD",
      //     },
      //     autoApply: true,
      //     singleDatePicker: $single,
      //     startDate: $departure,
      //     endDate: $arrival,
      //     drops: $size,
      //     minDate: moment(),
      //     parentEl: "#dates",
      //   },
      //   function (start, end, label) { }
      // );

      let $venta = $("#tipoVenta").val();
      console.log("tipo venta" + $venta);

      if ($venta == "local") {
        getCategoriasLocales();
      } else if ($venta == "foranea") {
        getCategorias();
      }

      if ($isPost == "vacio") {
        rewritePasajeros();
      }
    } //If venta web
    /*********************************** PAGO  *************** */
    var $topPago = $("#pago");
    var $pagoVicomm = $("#pagoVicomm");
    if ($topPago.length) {
      let $locale = $("#locale").val();
      let $total = Number($("#totalPagar").val());
      let $order_id = $("#order_id").val();
      let $email = $("#email").val();
      let $appcode = $("#appcode").val();
      let $appkey = $("#appkey").val();
      let $modenv = $("#modenv").val();

      var $locVi;
      if ($locale == "es_MX") {
        $locVi = "es";
      } else {
        $locVi = "en";
      }

      if ($pagoVicomm.length) {
        let paymentCheckout = new PaymentCheckout.modal({
          client_app_code: $appcode, // Application Code de las credenciales CLIENT
          client_app_key: $appkey, // Application Key de las credenciales CLIENT
          locale: $locVi, // Idioma preferido del usuario (es, en, pt). El inglés se usará por defecto
          env_mode: $modenv, // `prod`, `stg`, `local` para cambiar de ambiente. Por defecto es `stg`
          onOpen: function () {
            //console.log('Modal abierto');
          },
          onClose: function () {
            // console.log('Modal cerrado');
          },
          onResponse: function (response) {
            // Funcionalidad a invocar cuando se completa el proceso de pago

            switch (response.transaction.status_detail) {
              case 1:
                document.getElementById("response").innerHTML =
                  "Se requiere verificación, por favor revise la sección de Verificar.  ";
                break;
              case 3:
                let $order_id = response.transaction.dev_reference;
                let $urlConfirma = $("#urlBack").val();
                document.getElementById("response").innerHTML =
                  "No cierre ni actualice la ventana, en un momento será redireccionado. " +
                  $order_id;
                window.location.href =
                  $urlConfirma +
                  "&estatus=" +
                  response.transaction.status_detail;
                break;
              case 6:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Fraude.";
                break;
              case 7:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Reverso.  ";
                break;
              case 8:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Contracargo.  ";
                break;
              case 9:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por el procesador.  ";
                break;
              case 10:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por error en el sistema.  ";
                break;
              case 11:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Fraude detectado por Global Payments ViComm.  ";
                break;
              case 12:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Blacklist de Global Payments ViComm.  ";
                break;
              case 13:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Tiempo de tolerancia.  ";
                break;
              case 14:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Expirada por Global Payments ViComm.  ";
                break;
              case 15:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Expirado por el carrier.";
                break;
              case 19:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Código de autorización invalido.  ";
                break;
              case 20:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Código de autorización expirado.  ";
                break;
              case 21:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Fraude Global Payments ViComm - Reverso pendiente.  ";
                break;
              case 22:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por AuthCode Inválido - Reverso pendiente.  ";
                break;
              case 23:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por 	AuthCode Expirado - Reverso pendiente.  ";
                break;
              case 24:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Fraude Global Payments ViComm - Reverso solicitado.  ";
                break;
              case 25:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por AuthCode Inválido - Reverso solicitado.  ";
                break;
              case 26:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por AuthCode Expirado - Reverso solicitado.  ";
                break;
              case 27:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Comercio - Reverso pendiente.  ";
                break;
              case 28:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido rechazada por Comercio - Reverso solicitado.  ";
                break;
              case 29:
                document.getElementById("response").innerHTML =
                  "La transacción ha sido Anulada.  ";
                break;
              case 30:
                document.getElementById("response").innerHTML =
                  "Transacción asentada.  ";
                break;
              case 31:
                document.getElementById("response").innerHTML =
                  "Esperando OTP.  ";
                break;
              case 32:
                document.getElementById("response").innerHTML =
                  "OTP validado correctamente.  ";
                break;
              case 33:
                document.getElementById("response").innerHTML =
                  "OTP no validado. ";
                break;
              case 34:
                document.getElementById("response").innerHTML =
                  "Reverso parcial.";
                break;
              case 35:
                document.getElementById("response").innerHTML =
                  "Método 3DS solicitado, esperando para continuar.";
                break;
              case 36:
                document.getElementById("response").innerHTML =
                  "Desafío 3DS solicitado, esperando el CRES. ";
                break;
              case 37:
                document.getElementById("response").innerHTML =
                  "Rechazada por 3DS. ";
                break;
              default:
                document.getElementById("response").innerHTML =
                  "La transacción no pudo ser procesada. ";
                break;
            }

            // if(response.transaction.status_detail == 3){

            //    let $order_id = response.transaction.dev_reference;
            //    let $urlConfirma = $("#urlBack").val();
            //    document.getElementById('response').innerHTML = "No cierre ni actualice la ventana, en un momento será redireccionado. "  +$order_id ;

            //    window.location.href = $urlConfirma;

            // }else  if(response.transaction.status_detail == 1){
            //     document.getElementById('response').innerHTML = "La transacción se encuentra en revisión. En cuanto sea  aprobada recibirá sus tickes en su cuenta de correo." +$order_id ;
            //  }else  if(response.transaction.status_detail == 9){
            //   document.getElementById('response').innerHTML = "La transacción no ha sido autorizada." +$order_id ;
            //  } else  if(response.transaction.status_detail == 11){
            //   document.getElementById('response').innerHTML = "La transacción ha sido rechazada por el sistema antifraude." +$order_id ;
            //  }else  if(response.transaction.status_detail == 12){
            //   document.getElementById('response').innerHTML = "La transacción ha sido rechazada. Tarjeta en black list." +$order_id ;
            //  }else{

            //   document.getElementById('response').innerHTML = "La transacción no pudo ser procesada. "  +$order_id ;
            //   //document.getElementById('response').innerHTML = transaction.message;
            //  }
            console.log("Respuesta de modal" + JSON.stringify(response));
          },
        });

        let btnOpenCheckout = document.querySelector(".js-payment-checkout");
        let orderID = $("#order_id").val();

        btnOpenCheckout.addEventListener("click", function () {
          // Open Checkout with further options:
          paymentCheckout.open({
            user_id: "1234",
            user_email: $email, // Opcional
            order_description: "Tickets Winjet " + orderID,
            //order_description: 'Approved transaction',
            order_amount: $total,
            order_vat: 0,
            order_reference: $order_id,
            //order_installments_type: 2, // Opcional: 0 para permitir cuotas, -1 en caso contrario.
            //conf_exclusive_types: 'ak,ex', // Opcional: Tipos de tarjeta permitidos para esta operación. Opciones: https://developers.gpvicomm.com/api/#metodos-de-pago-tarjetas-marcas-de-tarjetas
            //conf_invalid_card_type_message: 'Tarjeta invalida para esta operación' // Opcional: Define un mensaje personalizado para mostrar para los tipos de tarjeta no válidos.
          });
        });

        // Cerrar el Checkout en la navegación de la página:
        window.addEventListener("popstate", function () {
          paymentCheckout.close();
        });
      }

      var $pago = $("#payment_amount").val();
      if ($pago == "") {
        window.location.href = "/";
      }
    }

    var $confirmacion = $("#confirmacion");
    if ($confirmacion.length) {
      var $post = $("#isPost").val();
      if ($post == "redirect") {
        window.location.href = "/";
      }
    }

    var $mpago = $("#btnMpago");
    if ($mpago.length) {
      let $pkey = $("#pkmpago").val();
      let $preferenceid = $("#preferenceMp").val();
      const mp = new MercadoPago($pkey, {
        locale: "es-MX",
      });

      // var $preferenceid = document.getElementById("preferenceMp").value;
      console.log("preferencia id:" + $preferenceid);
      mp.checkout({
        preference: {
          id: $preferenceid,
        },
        render: {
          container: ".cho-container",
          label: "Pagar con Mercado Pago",
        },
        theme: {
          elementsColor: "#f57d20",
        },
      });
    }
  });
})(jQuery);
