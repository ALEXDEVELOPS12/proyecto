# Guion del video demo: bot de ventas por WhatsApp de TeslaShop

**Duración objetivo:** 5 a 6 minutos.
**Formato:** grabación de pantalla (OBS o Xbox Game Bar: Win + G) con voz. WhatsApp Web en una ventana y n8n en otra.

## Antes de grabar (checklist)
- [ ] Abrir pestañas: WhatsApp Web (chat con +1 555 143 4400), n8n (workflow "TeslaShop Bot" → pestaña Executions), Neon (proyecto teslo-shop → Tables), la tienda https://proyecto-phi-wine.vercel.app y la diapositiva o imagen del diagrama de arquitectura.
- [ ] **Ocultar secretos:** no abrir credenciales de n8n, variables de Vercel ni el botón "Connect" de Neon. No mostrar el `.env`.
- [ ] En WhatsApp Web, archivar o borrar el chat de pruebas para empezar con la pantalla limpia.
- [ ] Para la escena 5 (concurrencia): tener Docker con la base local levantada (`docker compose up -d`) y el proyecto corriendo (`npm run dev`) en otra terminal.
- [ ] Probar una vez el guion completo sin grabar.

---

## Escena 1: Presentación (0:00 – 0:30)
**Pantalla:** la tienda TeslaShop.

> "Somos el grupo 4S1-SIS-S de Inteligencia Artificial de la UNI. Presentamos un sistema de ventas automatizado por WhatsApp para TeslaShop. Hoy las ventas por WhatsApp se atienden a mano y desconectadas del sistema, lo que causa respuestas lentas, riesgo de sobreventa y poca trazabilidad. Nuestro asistente atiende al cliente por WhatsApp usando el inventario real de la tienda."

## Escena 2: Arquitectura (0:30 – 1:15)
**Pantalla:** el diagrama de arquitectura y luego el lienzo de n8n.

> "El cliente escribe por WhatsApp. Meta envía el mensaje a n8n, que lo guarda en nuestra base de datos y se lo pasa a un agente con Claude Haiku. El agente tiene dos herramientas: buscar productos y reservar. Ambas llaman a una API propia de TeslaShop protegida con una clave. Nuestro principio es: n8n conversa, TeslaShop decide. El modelo nunca toca la base de datos directamente, así que, aunque se equivoque, no puede vender algo que no hay."

**Señalar en n8n, en orden:** WhatsApp Trigger → ¿Es texto? → Guardar mensaje → AI Agent (con buscar_productos y reservar) → Guardar respuesta → Send message.

## Escena 3: Compra exitosa (1:15 – 2:45)
**Pantalla:** WhatsApp Web. Escribir y esperar cada respuesta:

1. `Hola, qué sudaderas tienen?`
   > "El bot consultó el inventario real: nombres, precios y tallas salen de la base de datos, no los inventa."
2. `Quiero la 3D Wordmark en talla S`
   > "Antes de apartar, confirma el producto, la talla y el precio."
3. `Sí, apártala`
   > "Reservó la unidad y avisa que hay 15 minutos para pagar, con la hora exacta. Si no se paga, la unidad vuelve a estar disponible para otros clientes."

**Cambiar a n8n → Executions** y abrir la última ejecución → **Logs** del AI Agent:
> "Aquí se ve que el agente llamó a la herramienta reservar y lo que respondió la API."

## Escena 4: Casos límite y fallback (2:45 – 3:45)
**Pantalla:** WhatsApp Web.

1. `La tienen en talla M?`. Esa sudadera no tiene M.
   > "Si la talla no existe, el bot ofrece las tallas disponibles."
2. `Me ayudas con mi tarea de cálculo?`
   > "Si le preguntan algo fuera de la tienda, responde con cortesía que solo atiende temas de TeslaShop. No inventa ni se sale de su alcance."
3. `Tienen pantalones?`
   > "Si el producto no existe en el catálogo, lo dice con honestidad y ofrece lo que sí hay."

## Escena 5: Pregunta del profesor 1 — dos clientes y una sola unidad (3:45 – 4:45)
**Pantalla:** terminal de VS Code. Ejecutar:
```
npm run test:bot
```
> "En la defensa anterior nos preguntaron qué pasa si dos personas quieren la última unidad al mismo tiempo. Lo resolvimos con una actualización atómica en PostgreSQL: solo se aparta si todavía hay unidades disponibles, y la base de datos procesa las solicitudes una por una. Esta prueba simula 10 clientes reservando a la vez una sola unidad: exactamente uno la obtiene y los otros nueve reciben 'agotado'. Con 3 unidades, ganan exactamente 3. Nunca hay sobreventa."

**Señalar en la salida:** `pass 8`, `fail 0`, y las líneas de "10 clientes, 1 unidad".

> "Además usamos idempotencia: si WhatsApp reenvía el mismo mensaje, la reserva no se duplica."

## Escena 6: Pregunta del profesor 2 — dónde se guarda la conversación (4:45 – 5:30)
**Pantalla:** Neon → Tables → `ChatMessage` (y luego `Conversation`). **No abrir "Connect".**
> "La conversación se guarda en nuestra base de datos PostgreSQL. Hay una conversación por número de teléfono, y cada mensaje queda registrado con su dirección: inbound es el cliente, outbound es el bot. El asistente usa los últimos 10 mensajes como memoria."

**Opcional:** mostrar la tabla `StockReservation` con la reserva recién creada (estado `active` y hora de vencimiento).

**Pantalla:** https://proyecto-phi-wine.vercel.app/privacidad
> "Publicamos una política de privacidad que explica qué datos guardamos y cómo pedir que se eliminen."

## Escena 7: Cierre (5:30 – 6:00)
**Pantalla:** el lienzo de n8n o la tienda.
> "En resumen, el bot atiende consultas con datos reales, reserva sin sobreventa y deja todo registrado en el sistema. Como trabajo futuro: el control de stock por talla con SKU, la facturación automática y el escalamiento a un agente humano. Gracias."

---

## Consejos
- Hablar despacio. Si el bot tarda de 3 a 7 segundos, decirlo: *"está consultando el inventario"*.
- Si una respuesta sale distinta a la esperada, no se detengan: es un modelo generativo, y lo importante es que use datos reales.
- Grabar las escenas por separado y unirlas después (Clipchamp viene con Windows).
- Subir el video a YouTube como **No listado** o a Google Drive con acceso por enlace, y poner el enlace en el informe (Anexos) y en el README.
