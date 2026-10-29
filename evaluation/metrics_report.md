# Reporte de métricas: agente de ventas por WhatsApp de TeslaShop

- **Fecha de ejecución:** 28/10/2026, de 23:02 a 23:16 (hora de Nicaragua).
- **Canal:** WhatsApp, número de prueba +1 555 143 4400. Un evaluador del equipo con número verificado.
- **Conjunto:** `evaluation/test_conversations.json` (18 casos).
  - 16 se ejecutaron por WhatsApp.
  - T12 y T14 se verificaron a nivel de API con `npm run test:bot` y se excluyen de las métricas conversacionales.
- **Versión:** workflow v2.1. El System Message publicado aún contenía la regla de PayPal.

## Métricas conversacionales (Tabla 25)

| Métrica | Resultado | Meta propuesta | ¿Cumple? |
|---|---|---|---|
| Exactitud de intención | 16/16 = **100 %** | ≥ 90 % | Sí |
| Tasa de éxito de tarea | 15/16 = **93.8 %** | ≥ 85 % | Sí |
| Fallback correcto fuera de alcance (T15–T17) | 3/3 = **100 %** | 100 % | Sí |
| Satisfacción de usuarios (1–5) | [PENDIENTE] | ≥ 4.0 | — |
| Número de usuarios evaluados | 1 (evaluador del equipo) | 5 | No |

**Criterio estricto:** una tarea se considera exitosa solo si toda la conversación es correcta. T06 terminó en una reserva válida, pero se cuenta como no exitosa porque informó stock incorrecto en dos turnos.

## Resultados por diálogo (Tabla 26)

| ID | Intención detectada | ¿Intención correcta? | ¿Tarea exitosa? | Observaciones |
|---|---|---|---|---|
| T01 | saludo | Sí | Sí | Recordó una reserva pendiente de una prueba anterior |
| T02 | consultar_catalogo | Sí | Sí | 5 productos reales; incluyó una chaqueta entre las sudaderas |
| T03 | consultar_catalogo | Sí | Sí | 3 camisetas reales con precio, tallas y disponibles |
| T04 | consultar_catalogo | Sí | Sí | 2 gorras reales |
| T05 | consultar_disponibilidad_talla | Sí | Sí | Sin talla M; ofreció XS, S, XL, XXL |
| T06 | seleccionar_producto → confirmar_reserva | Sí | No | Mezcló datos de stock de otro producto en dos turnos; reservó al final (talla S) |
| T07 | seleccionar_producto → confirmar_reserva | Sí | Sí | 1.er intento: un mensaje multilínea copiado del bot hizo fallar el workflow (43 ms). Reintento: reservó 2 unidades con aviso de 15 min; pidió un correo para un enlace de PayPal inexistente |
| T08 | seleccionar_producto | Sí | Sí | No reservó ante «Mejor no» |
| T09 | seleccionar_producto | Sí | Sí | Rechazó 5XL y ofreció tallas disponibles |
| T10 | consultar_disponibilidad_talla | Sí | Sí | Sin talla M; ofreció las disponibles |
| T11 | consultar_catalogo | Sí | Sí | No inventó productos |
| T12 | — | — | Sí (API) | Verificado con pruebas de concurrencia (409) |
| T13 | seleccionar_producto | Sí | Sí | Informó el máximo de 10 unidades |
| T14 | — | — | Sí (API) | Verificado en producción (`duplicate:true`) |
| T15 | fuera_de_alcance | Sí | Sí | Fallback cortés; error gramatical «aparté» |
| T16 | fuera_de_alcance | Sí | Sí | No dio soporte técnico |
| T17 | fuera_de_alcance | Sí | Sí | Rechazó la tarjeta; prometió un enlace de pago inexistente |
| T18 | eliminar_datos | Sí | Sí | Confirmó el plazo de 7 días |

## Hallazgos
1. **Ambigüedad de producto por contexto:** «3D Wordmark» existe como camiseta y como sudadera. Tras hablar de camisetas, el agente eligió la camiseta (T06, T08, T09). Conviene que pregunte cuando hay más de una coincidencia.
2. **Stock mezclado entre productos (T06):** el agente dio tallas de otro producto en dos turnos. La reserva final la validó el servidor, lo que confirma que la integridad del inventario no depende del modelo.
3. **Mensaje multilínea (T07, primer intento):** un mensaje con varias líneas copiado de la respuesta del bot hizo fallar el workflow antes de llegar al agente (ejecución 131, 43 ms) y el cliente no recibió respuesta. Al reintentar con un mensaje de una línea, el caso se completó. [PENDIENTE: identificar el nodo que falló.]
4. **Promesa no respaldada (T07 y T17):** mencionó un enlace de pago que el sistema no envía y en T07 pidió el correo del cliente para enviarlo. Se debe a la regla de PayPal que aún estaba en el System Message publicado.
5. **Contexto arrastrado (T01, T15–T17):** retoma temas anteriores de la conversación. Es útil, pero puede resultar insistente.
6. **Errores menores de redacción:** «aparté» en lugar de «aparto» (T15–T17).

## Limitaciones de esta evaluación
- Un solo evaluador, del propio equipo, y una sola ejecución por caso.
- La intención detectada se infiere de la respuesta del agente: el agente no clasifica intenciones de forma explícita.
- Falta la prueba con 5 usuarios externos y la encuesta de satisfacción.
