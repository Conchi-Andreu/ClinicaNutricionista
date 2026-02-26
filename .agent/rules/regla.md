---
trigger: always_on
---

. Arquitectura y Diseño de Sistemas IA
Para que una aplicación de IA sea escalable y mantenible, la IA encargada de su desarrollo debe priorizar la modularidad y la separación de preocupaciones (Separation of Concerns).
•	Modularidad de Prompts: No utilices un único "mega-prompt". Divide las tareas en sub-prompts específicos (extracción, análisis, generación).
•	Orquestación RAG (Retrieval-Augmented Generation):
o	Utiliza RAG para datos volátiles, extensos o privados.
o	Reserva el Context Window para instrucciones de comportamiento y lógica de decisión.
•	Interoperabilidad: Define interfaces claras (APIs) entre los modelos de lenguaje y las herramientas externas (bases de datos, buscadores, calculadoras).
________________________________________
2. Ingeniería de Prompts y Gestión de Contexto
La IA debe generar instrucciones que minimicen la ambigüedad y maximicen la precisión del modelo final.
Práctica	Descripción	Objetivo
Few-Shot Prompting	Incluir 2-5 ejemplos de entrada/salida de alta calidad.	Reducir alucinaciones.
Chain-of-Thought	Forzar al modelo a explicar su razonamiento paso a paso.	Mejorar la lógica compleja.
Delimitadores	Usar Markdown (###, ---, xml tags) para separar secciones.	Evitar inyecciones de prompt.
Validación de Salida	Solicitar formatos estructurados (JSON, YAML) para facilitar el parsing.	Consistencia técnica.
________________________________________
3. Seguridad y Robustez Técnica
Como IA desarrolladora, debes anticipar vulnerabilidades específicas de los sistemas basados en modelos de lenguaje.
•	Sanitización de Inputs: Implementar filtros para detectar intentos de Prompt Injection (instrucciones del usuario que intentan saltarse las reglas del sistema).
•	Manejo de Errores (Graceful Degradation): Si un modelo falla o no tiene confianza suficiente, debe existir un flujo de retroceso (fallback) o una respuesta predefinida segura.
•	Determinismo vs. Creatividad: Ajusta la temperatura según el caso de uso.
o	Temp 0.0 - 0.2: Tareas técnicas, código, extracción de datos.
o	Temp 0.7+: Generación de contenido creativo, lluvia de ideas.
________________________________________
4. Ética y Cumplimiento Normativo
Toda aplicación generada debe alinearse con principios de IA responsable.
1.	Privacidad por Diseño (GDPR): Nunca incluyas datos personales identificables (PII) en los conjuntos de entrenamiento o en los logs de prompts sin anonimización previa.
2.	Mitigación de Sesgos: Audita las respuestas para evitar discriminación por género, raza, religión o ideología.
3.	Transparencia (Human-in-the-loop): La aplicación debe informar claramente al usuario que está interactuando con una IA y permitir la supervisión humana en decisiones críticas.
________________________________________
5. Ciclo de Vida y Evaluación (AgentOps)
El desarrollo no termina con el despliegue; requiere un ciclo de mejora continua.
•	Benchmarking: Crea un set de pruebas (Golden Dataset) con respuestas esperadas para evaluar cada iteración del modelo.
•	Monitoreo de Deriva (Drift): Los modelos cambian con el tiempo. Implementa logs que detecten cuando la calidad de las respuestas decae.
•	Versionado: Documenta y versiona tanto el código de la aplicación como los prompts utilizados.
