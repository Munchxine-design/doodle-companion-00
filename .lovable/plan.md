# Editor avanzado para “My universe.exe”

## Objetivo
Convertir el área actual en un lienzo visual editable, inspirado en un programa de dibujo, manteniendo intactos el estilo submarino, el contenido y las animaciones existentes. El cursor personalizado quedará siempre por encima del shimeji.

## Cambios
- Sustituir el editor básico de “My universe.exe” por un espacio de trabajo con barra de herramientas y panel de capas.
- Permitir añadir texto editable con familia, tamaño, color, alineación y estilo configurables.
- Permitir subir imágenes y GIFs, recortarlos antes de insertarlos y ajustar su encuadre después.
- Permitir mover, redimensionar, seleccionar, duplicar, borrar y bloquear elementos.
- Añadir orden de capas: subir, bajar, enviar al frente y al fondo, con visibilidad y bloqueo independientes.
- Añadir capas de dibujo libre sobre todo el lienzo, con pincel, borrador, color, grosor, deshacer, rehacer y limpiar capa.
- Guardar automáticamente el proyecto en el navegador para conservar la composición entre visitas.
- Mantener una vista limpia para visitantes; las herramientas aparecerán solamente en modo administrador.
- Elevar el cursor personalizado por encima del shimeji y del resto de ventanas flotantes.

## Detalles técnicos
- Ampliar el modelo local de elementos para incluir texto, imagen y dibujo, propiedades de estilo, bloqueo y visibilidad.
- Usar un canvas transparente por cada capa de dibujo para conservar el orden entre imágenes, textos y trazos.
- Implementar el recorte con un diálogo de previsualización, zoom y desplazamiento, generando el resultado local antes de añadirlo.
- Mantener compatibilidad con los datos simples ya guardados y migrarlos al nuevo formato al cargarlos.
- Añadir controles adaptables para escritorio y móvil, con acciones accesibles y dimensiones estables.

## Verificación
- Comprobar compilación y carga sin pantalla en blanco.
- Probar selección, movimiento, bloqueo, reordenamiento, texto, carga/recorte de imagen y dibujo.
- Confirmar persistencia tras recargar y comprobar que visitantes no ven herramientas.
- Revisar escritorio y móvil, además de confirmar que el cursor queda sobre el shimeji.
