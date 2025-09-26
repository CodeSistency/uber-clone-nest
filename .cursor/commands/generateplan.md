
"Actúa como un planificador de desarrollo de software experto y crea un plan de desarrollo detallado para mi proyecto, considerando su complejidad y permitiendo múltiples planes para diferentes instancias de desarrollo. Sigue estas instrucciones estrictamente:

Análisis de Complejidad:

Determina si el proyecto es simple (puede generarse un plan completo en una sola iteración) o complejo (requiere un plan por etapas, generando una etapa detallada por iteración).
Si no se proporciona información sobre el proyecto, asume un proyecto web genérico con frontend (HTML/CSS/JS, preferiblemente React) y backend (Node.js o Python/FastAPI), con una base de datos (como PostgreSQL o MongoDB). Ajusta según cualquier contexto previo del proyecto (por ejemplo, filetree o código analizado).
Solicita al usuario un nombre para el proyecto o instancia de desarrollo (por ejemplo, 'auth_system' o 'user_dashboard'). Si no se proporciona, sugiere un nombre basado en el propósito del proyecto (por ejemplo, 'web_app_v1') y confirma antes de proceder.


Gestión de la Carpeta del Plan:

Crea una subcarpeta en /docs/plan/<nombre_proyecto>/ donde <nombre_proyecto> es el nombre proporcionado o sugerido para el proyecto.
Genera o actualiza el archivo plan.json dentro de /docs/plan/<nombre_proyecto>/plan.json para almacenar el plan de desarrollo.
Si la carpeta ya existe, verifica si contiene un plan.json y sugiere usar ese plan existente o crear uno nuevo (sobrescribiendo o renombrando con confirmación).


Formato del Plan:

Usa el siguiente formato para estructurar el plan:[] Etapa <número>: <Nombre de la etapa>
    [<ID>] Módulo <nombre del módulo> (<Progreso: X%>, Prioridad: <Alta/Media/Baja>)
        Descripción: <Descripción clara del propósito del módulo>
        Dependencias: <Lista de archivos, módulos o recursos que este módulo requiere>
        [<ID>] Tarea <nombre de la tarea>
            Descripción: <Descripción detallada de lo que debe hacerse>
            [<ID>] Subtarea <nombre de la subtarea>
                Descripción: <Descripción específica de la subtarea>


Asigna un ID único a cada etapa, módulo, tarea y subtarea (por ejemplo, E1, M1.1, T1.1.1, ST1.1.1.1).
Incluye un porcentaje de progreso inicial para cada módulo (por ejemplo, 0% si no se ha iniciado, o un estimado basado en el contexto).
Asigna una prioridad (Alta, Media, Baja) según la importancia del módulo/tarea para el proyecto.
En Dependencias, lista cualquier archivo, módulo o recurso externo que el módulo o tarea requiera (por ejemplo, un archivo utils.js importado o una tabla de base de datos).


Generación del Plan:

Para proyectos simples (por ejemplo, una sola feature o un proyecto pequeño), genera el plan completo en una sola iteración, cubriendo todas las etapas, módulos, tareas y subtareas necesarias.
Para proyectos complejos (por ejemplo, un proyecto full-stack con múltiples módulos), genera solo una etapa detallada por iteración. Cada etapa debe incluir módulos, tareas y subtareas relevantes, con descripciones claras y completas.
Asegúrate de que las descripciones sean específicas, detallando qué se debe hacer sin incluir código (por ejemplo, 'Crear un endpoint REST para registrar usuarios' en lugar de código real).
Considera un flujo lógico de desarrollo (por ejemplo, configuración inicial → backend → frontend → integración → pruebas).


Dependencias:

Identifica dependencias entre módulos, tareas o archivos. Por ejemplo, si un módulo frontend depende de un endpoint del backend, indícalo explícitamente como dependencia (por ejemplo, 'Depende de: archivo api/users.js').
Si no hay información específica, haz suposiciones razonables basadas en un proyecto típico (por ejemplo, un componente React depende de un archivo de estilos CSS o un servicio del backend).


Generación del Archivo JSON:

Genera o actualiza el archivo /docs/plan/<nombre_proyecto>/plan.json con la estructura del plan, usando el siguiente formato:{
  "proyecto": "<nombre_proyecto>",
  "etapas": [
    {
      "id": "E1",
      "nombre": "Nombre de la etapa",
      "modulos": [
        {
          "id": "M1.1",
          "nombre": "Nombre del módulo",
          "progreso": 0,
          "prioridad": "Alta",
          "descripcion": "Descripción del módulo",
          "dependencias": ["archivo1.js", "endpoint:/api/users"],
          "tareas": [
            {
              "id": "T1.1.1",
              "nombre": "Nombre de la tarea",
              "descripcion": "Descripción de la tarea",
              "subtareas": [
                {
                  "id": "ST1.1.1.1",
                  "nombre": "Nombre de la subtarea",
                  "descripcion": "Descripción de la subtarea"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}


Asegúrate de incluir el campo "proyecto": "<nombre_proyecto>" en el JSON para identificar la instancia de desarrollo.


Sugerencias al Final:

Al final de cada iteración, incluye una sección llamada 'Próximos Pasos Recomendados' con al menos tres sugerencias específicas, como:
Continuar desarrollando la siguiente etapa del plan.
Modificar una parte específica del plan (por ejemplo, ajustar prioridades o agregar un módulo).
Generar el archivo /docs/plan/<nombre_proyecto>/plan.json con la estructura completa del plan.
Revisar dependencias o tareas para mayor claridad.




Detalles Adicionales:

Asegúrate de que el plan sea claro, conciso y actionable, con descripciones que cualquier desarrollador pueda entender.
Si hay contexto previo (por ejemplo, un filetree o análisis de código), incorpóralo para hacer el plan más relevante.
Si no hay contexto suficiente, pide aclaraciones específicas (por ejemplo, 'Por favor, especifica el lenguaje principal, las features clave o el nombre del proyecto') y haz suposiciones razonables mientras tanto.



Comienza ejecutando este prompt: solicita un nombre para el proyecto o sugiere uno basado en el contexto, crea la carpeta /docs/plan/<nombre_proyecto>/, genera la primera iteración del plan (o el plan completo si es simple) en /docs/plan/<nombre_proyecto>/plan.json, usa el formato especificado, asigna IDs únicos, porcentajes de progreso, prioridades y dependencias claras. ¡Inicia ahora!"