Flujo Unificado del Cliente
Este documento describe el flujo de usuario unificado para la aplicación, comenzando desde la pantalla principal y ramificándose según la elección de servicio del cliente.
PASO_1_PANTALLA_DE_INICIO_Y_SELECCION
Descripción del Estado y UI: El cliente abre la aplicación. Se le presenta una vista con un mapa principal que muestra su ubicación actual. Un bottomsheet está desplegado al 20% de la pantalla, con una lista de servicios disponibles.
Comportamiento del bottomsheet: Se puede deslizar hacia arriba para mostrar más servicios y se puede cerrar deslizando hacia abajo o tocando fuera.
Acción del Usuario: El cliente navega por las opciones de servicio en el bottomsheet y selecciona el tipo de servicio que desea.
Ramificación de Servicios
El flujo continúa dependiendo de la selección del cliente.
A. Si el cliente selecciona "Transporte" (Viajes)
PASO_2_DEFINICION_DE_VIAJE:
Descripción del Estado y UI: El bottomsheet se despliega al 50% de la pantalla. La UI muestra dos campos de entrada de texto (inputs) con iconos: "Origen" y "Destino". Debajo de los inputs, aparecen sugerencias como "Casa", "Trabajo" y una sección de "Viajes recientes".
Comportamiento del bottomsheet: Se puede deslizar para cerrar o expandir al 100%.
PASO_3_SELECCION_DE_VEHICULO:
Descripción del Estado y UI: El bottomsheet se expande al 70% de la pantalla. La UI presenta dos pestañas (tabs) en la parte superior: "Carro" y "Moto". Debajo de las pestañas, se muestran tarjetas con los tipos de servicio (Carro XL, Premium, Básico, etc.), junto con el precio estimado y el tiempo de llegada.
Comportamiento del bottomsheet: Se puede deslizar para cerrar o volver al paso anterior.
PASO_4_ELECCION_DE_CONDUCTOR_Y_PAGO_PREVIO:
Descripción del Estado y UI: El bottomsheet se despliega al 90% de la pantalla para mostrar la mayor cantidad de información. La UI muestra una lista de tarjetas de conductores disponibles, cada una con su foto, calificación, tipo de vehículo y precio. Debajo de la lista, se visualiza la sección de "Metodología de Pago" con opciones (Efectivo, Transferencia, Criptomoneda).
Comportamiento del bottomsheet: Se puede deslizar para cerrar.
PASO_5_GESTION_DE_CONFIRMACION_DEL_CONDUCTOR:
Descripción del Estado y UI: El bottomsheet se minimiza al 30% de la pantalla. La UI principal es el mapa con un icono animado del conductor moviéndose en tiempo real hacia el punto de origen. El bottomsheet muestra los detalles del conductor y el estado del viaje.
Comportamiento del bottomsheet: Se puede deslizar para expandir y ver más detalles del viaje o para cerrarlo.
PASO_6_DURANTE_Y_FINALIZACION:
Descripción del Estado y UI: Cuando el viaje comienza, el bottomsheet se mantiene al 30% mostrando los detalles de la ruta y el precio actual. Al finalizar, el bottomsheet se expande al 70% para mostrar un resumen del viaje y la interfaz de calificación.
Comportamiento del bottomsheet: No se puede cerrar hasta que se califica al conductor, asegurando que se complete el proceso.
B. Si el cliente selecciona "Delivery" (para negocios)
PASO_2_BUSQUEDA_Y_SELECCION_NEGOCIO:
Descripción del Estado y UI: El bottomsheet se despliega al 90% de la pantalla. La UI presenta una barra de búsqueda y un carrusel de categorías o un listado de negocios.
Comportamiento del bottomsheet: Se puede deslizar para cerrar o para expandir.
PASO_3_ARMADO_DEL_PEDIDO:
Descripción del Estado y UI: El bottomsheet es una vista de pantalla completa (modal). La UI muestra el menú del negocio con imágenes, precios y la opción de añadir al carrito. En la parte inferior, un botón CTA (Call-to-Action) para "Ver Carrito".
Comportamiento del bottomsheet: No se puede deslizar.
PASO_4_CHECKOUT_Y_CONFIRMACION:
Descripción del Estado y UI: El bottomsheet permanece en pantalla completa. La UI es un formulario de checkout con campos para dirección de entrega, un resumen del pedido, la selección de método de pago y un campo para comentarios.
Comportamiento del bottomsheet: No se puede deslizar, para evitar que el usuario lo cierre accidentalmente antes de confirmar el pedido.
PASO_5_SEGUIMIENTO_DEL_DELIVERY:
Descripción del Estado y UI: El bottomsheet se minimiza al 30% de la pantalla. La UI es un mapa con el icono del conductor y un bottomsheet que muestra el estado del pedido: "En preparación", "Buscando conductor", "Conductor asignado", "En camino".
Comportamiento del bottomsheet: Se puede deslizar para expandir y ver más detalles del pedido o para cerrarlo.
C. Si el cliente selecciona "Mandado" (personal)
PASO_2_DETALLES_DE_MANDADO:
Descripción del Estado y UI: El bottomsheet se despliega a pantalla completa. La UI presenta un formulario con:
Un campo de texto para "Descripción del mandado" (ej. "Comprar una medicina en la farmacia X").
"Lista de artículos" con la opción de añadir varios elementos (ej. "pan canilla, un cartón de huevos").
"Dirección de recogida" y "Dirección de entrega".
Un campo para "Tipo de producto" (ej. perecedero, frágil, etc.).
Comportamiento del bottomsheet: Se puede deslizar para cerrar.
PASO_3_PRECIO_ESTIMADO_Y_PAGO:
Descripción del Estado y UI: El bottomsheet permanece en pantalla completa. La UI muestra un resumen del precio estimado del servicio de mandado (excluyendo el costo de los productos) y la sección de "Metodología de Pago". El usuario debe confirmar.
Comportamiento del bottomsheet: Se puede deslizar para cerrar.
PASO_4_BUSCANDO_Y_ASIGNANDO_CONDUCTOR:
Descripción del Estado y UI: El bottomsheet se minimiza al 30% de la pantalla. La UI muestra el mapa y una animación de "Buscando conductor...".
Comportamiento del bottomsheet: No se puede deslizar mientras se busca un conductor.
PASO_5_COMUNICACION_Y_CONFIRMACION_DEL_MANDADO:
Descripción del Estado y UI: Una vez asignado el conductor, el bottomsheet se despliega al 50%. La UI muestra los detalles del conductor y un icono para abrir el chat.
Chat: El conductor puede enviar fotos o mensajes para confirmar los productos y el precio final de los mismos.
Comportamiento del bottomsheet: Se puede deslizar para cerrar.
PASO_6_FINALIZACION:
Descripción del Estado y UI: El conductor llega, el cliente recibe el mandado y se realiza el cobro final, el cual incluye el costo del servicio más el costo de los productos si aplica. La UI muestra un resumen y la interfaz de calificación.
Comportamiento del bottomsheet: No se puede cerrar hasta que se califique al conductor.
D. Si el cliente selecciona "Envío de Paquete"
PASO_2_DETALLES_DEL_ENVIO:
Descripción del Estado y UI: El bottomsheet se despliega a pantalla completa. La UI es un formulario con campos para:
"Dirección de origen" y "Dirección de destino".
"Tipo de paquete" (con opciones como "documentos", "electrónicos", etc.).
"Tamaño estimado" (ej. pequeño, mediano, grande).
"Peso estimado" (ej. liviano, pesado).
"Descripción del paquete" y "Datos de contacto" de la persona que recibe.
Comportamiento del bottomsheet: No se puede cerrar hasta que se confirmen los datos.
PASO_3_CALCULAR_PRECIO_Y_PAGAR:
Descripción del Estado y UI: El bottomsheet permanece en pantalla completa. La UI muestra el precio fijo del servicio, calculado según el tamaño y la distancia, y la sección de "Metodología de Pago".
Comportamiento del bottomsheet: Se puede deslizar para cerrar.
PASO_4_SEGUIMIENTO_DEL_PAQUETE:
Descripción del Estado y UI: El bottomsheet se minimiza al 30% de la pantalla. La UI es un mapa con el icono del conductor y un pequeño panel que muestra los estados: "En camino a recoger", "Paquete recogido", "En ruta a destino".
Comportamiento del bottomsheet: Se puede deslizar para expandir y ver los detalles del envío.
PASO_5_CONFIRMACION_DE_ENTREGA:
Descripción del Estado y UI: Al llegar, el conductor tiene la opción de solicitar una firma digital o tomar una foto de la entrega a modo de prueba.
Comportamiento del bottomsheet: No se puede cerrar hasta que se confirme la entrega.
