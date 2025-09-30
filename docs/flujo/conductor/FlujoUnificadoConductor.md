Flujo Unificado del Conductor
Este documento detalla el flujo de usuario del conductor, unificando la lógica y la interfaz de usuario para los diferentes servicios de la aplicación: transporte, delivery, mandados y envíos.
PASO_1_DISPONIBILIDAD
Descripción del Estado y UI: El conductor ha iniciado sesión en la aplicación. La interfaz principal es un mapa. Un botón grande con la etiqueta "Desconectado" está visible, y al presionarlo, el estado cambia a "Conectado".
Comportamiento del botón: Al estar conectado, el botón cambia a un color vibrante (ej. verde) y se habilita la recepción de solicitudes.
PASO_2_RECEPCION_DE_SOLICITUD
Descripción del Estado y UI: El conductor se encuentra conectado. Cuando el sistema asigna un servicio, una notificación en formato de bottomsheet emerge automáticamente desde la parte inferior de la pantalla.
Comportamiento del bottomsheet: Se despliega al 30% de la pantalla, es fijo (no se puede cerrar) y tiene un temporizador (countdown) visible (ej. 30 segundos) para que el conductor tome una decisión.
UI del bottomsheet:
Servicio: Icono y etiqueta del servicio (ej. Transporte, Delivery, Mandado, Envío).
Origen y Destino: Dirección de recogida y de entrega.
Precio Estimado: El conductor puede ver el valor aproximado del servicio.
Acciones: Dos botones claros: "Aceptar" y "Rechazar".
Casos a considerar:
Rechazo: Si el conductor presiona "Rechazar" o el temporizador llega a cero, la notificación desaparece y el sistema busca otro conductor.
Aceptación: Si el conductor presiona "Aceptar", el flujo avanza.
Ramificación de Servicios
El flujo del conductor continúa dependiendo del servicio aceptado.
A. Si acepta "Transporte" (Viajes)
PASO_3_NAVEGACION_A_ORIGEN:
UI: El mapa principal se actualiza y muestra la ubicación del conductor y la ruta hacia el punto de recogida del cliente.
bottomsheet: Permanece visible al 30% de la pantalla mostrando los datos del cliente (nombre, calificación, foto) y la dirección de origen. Un botón "Iniciar navegación" activa la guía GPS.
PASO_4_LLEGADA_A_ORIGEN:
UI: Al llegar a la zona de recogida, el bottomsheet se expande al 50%. Un botón "He llegado" es prominente.
Comportamiento: Al presionar "He llegado", el cliente recibe una notificación de que el conductor ha llegado.
UI Adicional: Se habilita la opción de "Llamar al cliente".
PASO_5_INICIO_DE_VIAJE:
UI: El conductor se asegura de que el cliente esté en el vehículo. Al presionar "Iniciar viaje", la ruta en el mapa cambia hacia el destino final.
bottomsheet: Se actualiza al 30% mostrando el progreso del viaje.
PASO_6_FINALIZACION_DE_VIAJE:
UI: Al llegar al destino, un botón "Finalizar viaje" se activa. Al presionarlo, un bottomsheet se despliega al 70%.
UI de pago: Muestra el costo final del viaje y el método de pago elegido por el cliente. Si es en efectivo, se muestra un mensaje para "Confirmar cobro".
Comportamiento: La confirmación de cobro es obligatoria para finalizar el servicio.
B. Si acepta "Delivery" (para negocios)
PASO_3_NAVEGACION_A_NEGOCIO:
UI: El mapa muestra la ruta hacia el negocio. El bottomsheet al 30% muestra los detalles del pedido (número, nombre del cliente) y del negocio.
PASO_4_RECOGIDA_DEL_PEDIDO:
UI: Al llegar al negocio, un botón "He recogido el pedido" se activa.
Comportamiento: Al presionarlo, el estado del pedido cambia a "En camino al cliente" y el mapa muestra la ruta de entrega.
PASO_5_ENTREGA_A_CLIENTE:
UI: Al llegar al destino del cliente, un botón "He entregado el pedido" aparece en el bottomsheet.
Comportamiento: Al presionar, el flujo de pago se activa.
PASO_6_CONFIRMACION_Y_FINALIZACION:
UI: Un bottomsheet se expande al 70% mostrando el costo total del servicio y el método de pago.
Comportamiento: Se pide al conductor que confirme la entrega y, si es en efectivo, que confirme el cobro.
C. Si acepta "Mandado" (personal)
PASO_3_NAVEGACION_A_ORIGEN_Y_CHAT:
UI: El mapa muestra la ruta hacia el punto de recogida. El bottomsheet al 30% muestra la descripción del mandado y un icono para iniciar el chat con el cliente.
PASO_4_GESTION_DEL_MANDADO:
UI: Al llegar, un botón "Estoy en el punto de recogida" se activa.
Comportamiento: Se habilita el chat para que el conductor pueda confirmar los detalles, enviar fotos de los productos y notificar al cliente el costo final de los artículos antes de comprarlos. Una vez confirmados los productos, un campo de entrada permite al conductor ingresar el costo final.
PASO_5_NAVEGACION_A_DESTINO:
UI: Al presionar "Iniciar entrega", la ruta en el mapa cambia hacia el destino final del cliente.
PASO_6_ENTREGA_Y_FINALIZACION:
UI: Un botón "Finalizar mandado" se activa. El bottomsheet se expande al 70% mostrando el resumen del cobro: costo del servicio + costo de los artículos.
Comportamiento: Se pide al conductor que confirme que recibió el cobro total.
D. Si acepta "Envío de Paquete"
PASO_3_NAVEGACION_A_ORIGEN:
UI: Similar a transporte. El bottomsheet muestra los detalles del paquete (descripción, tamaño) y la ruta hacia el origen.
PASO_4_RECOGIDA_DEL_PAQUETE:
UI: Un botón "He recogido el paquete" se activa. El bottomsheet se expande al 50% y muestra la información de contacto del receptor.
PASO_5_NAVEGACION_A_DESTINO:
UI: El mapa se actualiza con la ruta al destino.
Comportamiento: La UI muestra los datos del receptor para que el conductor pueda contactarlo.
PASO_6_ENTREGA_CON_CONFIRMACION:
UI: Al llegar, un botón "Finalizar entrega" se activa. Al presionarlo, una pantalla modal o bottomsheet pide la firma digital del receptor o la opción de tomar una foto del paquete como prueba de entrega.
Comportamiento: El servicio se considera finalizado una vez que se obtiene la prueba.
FINALIZACION_DEL_SERVICIO (Unificado para todos los casos)
Descripción del Estado y UI: Después de confirmar el pago o la entrega, el bottomsheet se expande al 70%. La UI muestra un formulario de calificación (rating) con estrellas para valorar al cliente o al negocio.
Comportamiento: El conductor debe calificar para que el servicio se marque como completado en su historial. El bottomsheet no se puede cerrar sin calificar.
Casos Generales a Considerar:
Cancelación del cliente: Si el cliente cancela, una notificación emergente avisa al conductor y el sistema vuelve al estado de DISPONIBILIDAD.
Problemas con la dirección: El conductor tiene la opción de "Contactar al cliente" (Llamar o Chat) en cualquier momento del flujo activo.
Gestión de errores: Si la aplicación pierde la conexión a internet, un mensaje debe notificar al conductor y mantener la información del viaje para cuando la conexión se restablezca.
