# "One Conversation": análisis y guión del clip original

Análisis del clip de referencia (USE CASE 3 de la serie *Made with Claude Opus 5.5*), reconstruido a partir de los 7 archivos `.mov` (`mp4_00000000` … `mp4_00003300`).

- **Fuente unida:** 67,6 s · 1920×1080 · 55 fps (grabación de pantalla). Cada parte se solapaba ~21 fotogramas con la siguiente, así que se cortó cada una a 550 fotogramas (10 s) antes de unirlas.
- **Película real (según su propio HUD):** 1920×1080 · 30 fps · **68,5 s** · 2.055 fotogramas · 12 tomas · 120 BPM.
- **Audio:** la pista de los 7 archivos llega **en silencio digital (−91 dB)**. La grabación no capturó el sonido, así que la música y los efectos se recomponen desde cero (ver §4).
- Hojas de contacto y detalles a resolución completa en [`analisis/`](analisis/).

> **Regla del proyecto:** en la réplica solo cambia el **texto** (columna "Texto en pantalla"). Animación, tiempos, colores, tipografías, cámara y sonido se mantienen iguales.
> Todos los textos editables están en [`textos.json`](textos.json).

---

## 1. Sistema visual (no se modifica)

| Elemento | Valor |
|---|---|
| Tipografía display | **Fraunces** cursiva (títulos de rol, "Yes.", "One Conversation", frase final) |
| Tipografía UI | **IBM Plex Mono** (input, HUD, etiquetas, guion, timecodes) |
| Fondo acto 1–2 | Azul noche `#070B16` con viñeta, polvo/estrellas y un leve resplandor cálido |
| Fondo acto 3 | Crema cálido con degradado a celeste (amanecer / "DAY") |
| Acento (botón enviar, reloj) | Naranja `#E07A55` |
| Color por rol | Writer `#FFB547` · Art `#FF5C8A` · Animation `#3FE0A5` · Score `#9B7BFF` · Sound `#C8F05A` · Edit `#5CC8FF` · Render `#FFD86B` |
| HUD fijo (letterbox) | Arriba izq.: `● 2:07 AM` (reloj que avanza) · Arriba der.: `ROLES n / 7` · Abajo izq.: `› estado` · Abajo der.: `● WRITER ● ART ● ANIMATION ● SCORE ● SOUND ● EDIT ● RENDER` (cada punto se enciende con el color de su rol) |
| Cámara | Paneles en 3D con perspectiva inclinada, dolly lento y constante, desenfoque de profundidad en las transiciones, glow y halo del color del rol |

---

## 2. Estructura (beat sheet según la línea de tiempo del Editor dentro del propio clip)

| # | Toma | Duración | Tiempo aprox. en el clip |
|---|---|---|---|
| 01 | hook | 6,0 s | 0:00 – 0:06 |
| 02 | old way | 6,0 s | 0:06 – 0:12 |
| 03 | turn | 6,0 s | 0:12 – 0:18 |
| 04 | writer | 4,0 s | 0:18 – 0:22 |
| 05 | art | 4,0 s | 0:22 – 0:26 |
| 06 | animator | 4,0 s | 0:26 – 0:30 |
| 07 | composer | 4,0 s | 0:30 – 0:34 |
| 08 | sound | 4,0 s | 0:34 – 0:38 |
| 09 | editor | 6,0 s | 0:38 – 0:44 |
| 10 | render | 6,0 s | 0:44 – 0:50 |
| 11 | climax | 10,0 s | 0:50 – 1:00 |
| 12 | resolve | 8,5 s | 1:00 – 1:08,5 |

---

## 3. Guión toma por toma: TABLA DE TEXTOS

La columna **ID** es la clave en `textos.json`. Para cambiar el video, solo se edita **Texto en pantalla**.
"Largo máx." es una guía para que el texto nuevo quepa en la misma animación sin romper el diseño.

### 01 · HOOK (0:00–0:06): oscuridad, un cursor parpadea

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `hud.clock_start` | 0:00 | `2:07 AM` | Reloj grande en Fraunces cursiva sobre la caja. También se repite en el HUD superior. | ~8 |
| `hook.typed` | 1,8–5,5 s | `I have an idea. I don't have a team.` | Aparece la caja de input con borde suave y se escribe letra a letra (máquina de escribir con cursor y clic de tecla). | ~40 |
| `hud.status.new` | 1,8 s → | `new conversation` | Estado del HUD inferior. | ~24 |

### 02 · OLD WAY (0:06–0:12): el caos de hacerlo "a la antigua"

Ventanas de software que vuelan desde el fondo y se apilan alrededor del input, cada vez más rápido. La cámara tiembla un poco y todo se tiñe de rojo hasta el golpe final.

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `oldway.timeline_title` | 6,0 s | `edit_final_v7_REAL` | Ventana de timeline con clips rotos | ~20 |
| `oldway.media_offline` | 6,0 s | `MEDIA OFFLINE` | Etiquetas rojas parpadeando sobre los clips (×3) | ~14 |
| `oldway.plugin_error` | 6,8 s | `Plugin failed to load · error 0x3F` | Notificación de error con icono "!" rojo | ~36 |
| `oldway.unread` | 7,5 s | `unread` (contador `3` → `112`) | Campana; el número sube rápido de 3 a 112 | número + ~8 |
| `oldway.deadline` | 7,8 s | `DEADLINE · FRI 9:00 AM` | Calendario con borde rojo superior | ~22 |
| `oldway.license` | 6,9 s | `License required — $49` | Ventana de audio con candado | ~24 |
| `oldway.rendering` | 7,9 s | `Rendering… 99%` | Barra de progreso trabada en 99 % | ~16 |
| `oldway.invoice_label` | 7,9 s → | `INVOICE` | Encabezado de las 4 facturas | ~8 |
| `oldway.invoice_1` | 7,9 s | `Motion designer — $4,800` | Factura que entra deslizando | ~26 |
| `oldway.invoice_2` | 8,8 s | `Composer — $2,500` | Factura | ~26 |
| `oldway.invoice_3` | 9,0 s | `Editor — $3,000` | Factura | ~26 |
| `oldway.invoice_4` | 9,0 s | `Sound mix — $1,200` | Factura | ~26 |
| `oldway.total` | 9,5 s | `TOTAL $11,500` | Sello blanco que cae desde la cámara con motion blur y golpe (stamp) | ~14 |
| `oldway.render_failed` | 10,8 s | `RENDER FAILED` | Modal rojo con ✕ y barra roja. Viñeta roja en toda la pantalla. | ~16 |

> ⚠️ El total tiene que coincidir con la suma de las facturas (4.800 + 2.500 + 3.000 + 1.200 = **11.500**). Si cambias montos o moneda, ajusta el total.

### 03 · TURN (0:12–0:18): el giro, una sola pregunta

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| (reusa `hook.typed`) | 12,0 s | (frase del hook) | Todo el caos se desenfoca y se aleja (rack focus). El input queda solo. | — |
| `turn.typed` | 12,8–14,3 s | `Can you help me make it?` | La caja se vacía y se escribe la nueva pregunta | ~30 |
| `hud.status.thinking` | 15,0 s | `claude is thinking…` | El mensaje sube como burbuja y aparecen "• • •" | ~24 |
| `turn.claude_label` | 16,0 s | `CLAUDE` | Etiqueta pequeña sobre la respuesta | ~8 |
| `turn.answer_big` | 16,0 s | `Yes.` | Fraunces enorme en degradado naranja/durazno; una línea de luz cruza la pantalla | ~6 |
| `turn.answer_line` | 16,3–17,5 s | `Let's start with the story.` | Se escribe en cursiva bajo el "Yes." y la cámara empuja hacia el guion | ~32 |
| `hud.status.yes` | 16,0 s | `yes.` | Estado HUD | ~24 |

### 04 · THE WRITER (0:18–0:22), rol 01/07, color ámbar

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `role.writer.title` | 18,0 s | `the Writer` | Título en Fraunces cursiva con glow ámbar, entra con fade y desplazamiento | ~16 |
| `role.writer.index` | 18,0 s | `01 / 07` | Índice sobre el título | — |
| `writer.fade_in` | 18,0 s | `FADE IN:` | Encabezado del guion en una hoja 3D inclinada | ~10 |
| `writer.slug` | 18,0 s | `INT. STUDIO APARTMENT — 2:07 AM` | Encabezado de escena, tipeado | ~34 |
| `writer.action` | 18,3 s | `A cursor blinks. One creator. No team.` | Línea de acción, tipeada | ~42 |
| `writer.char_1` | 19,0 s | `CREATOR` | Nombre del personaje | ~10 |
| `writer.line_1` | 19,0 s | `Can you help me make it?` | Diálogo (debería coincidir con `turn.typed`) | ~30 |
| `writer.char_2` | 19,5 s | `CLAUDE` | Nombre resaltado con fondo ámbar | ~10 |
| `writer.line_2` | 19,8 s | `Yes. Let's start with the story.` | Diálogo (debería coincidir con la respuesta) | ~36 |
| `writer.cut_to` | 20,5 s | `CUT TO:` | Transición en ámbar | ~10 |
| `hud.status.writer` | 18,0 s | `writing the script` | Estado HUD. Se enciende ● WRITER. | ~24 |

### 05 · THE ART DIRECTOR (0:22–0:26), rol 02/07, color rosa

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `role.art.title` | 22,0 s | `the Art Director` (2 líneas) | Título rosa | ~16 por línea |
| `art.font_card` | 22,0 s | `Aa` · `Fraunces · 144` · `IBM Plex Mono` | Fichas de tipografía | — |
| `art.moods` | 22,5 s | `NIGHT` · `DAWN` · `EMBER` · `DAY` | Fichas de mood con degradados | ~8 c/u |
| `art.swatches` | 22,0–24,0 s | `#070B16 #E07A55 #FFB547 #FF5C8A #3FE0A5 #9B7BFF #C8F05A #5CC8FF #FFD86B` | Esferas de color que vuelan, rebotan y se ordenan en fila; aparece un selector de color circular | (hex, no se cambian) |
| `hud.status.art` | 22,0 s | `building the look` | Estado HUD | ~24 |

### 06 · THE ANIMATOR (0:26–0:30), rol 03/07, color verde menta

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `role.animator.title` | 26,0 s | `the Animator` | Título verde | ~16 |
| `animator.ease_a` | 26,0 s | `linear` | Editor de curvas: la bola recorre una recta | ~14 |
| `animator.ease_b` | 28,0 s | `back.out(1.7)` | Un cursor arrastra el manejador, la curva se vuelve elástica y la bola rebota con estela | ~14 |
| `hud.status.animator` | 26,0 s | `animating 214 keyframes` | Estado HUD | ~26 |

### 07 · THE COMPOSER (0:30–0:34), rol 04/07, color violeta

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `role.composer.title` | 30,0 s | `the Composer` | Título violeta | ~16 |
| `composer.meta` | 30,0 s | `120 BPM · 4/4 · score.wav` | Piano roll: las notas aparecen al paso del cabezal, con la forma de onda debajo | ~28 |
| `hud.status.composer` | 30,0 s | `scoring · 120 bpm` | Estado HUD | ~24 |

### 08 · THE SOUND DESIGNER (0:34–0:38), rol 05/07, color lima

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `role.sound.title` | 34,0 s | `the Sound Designer` | Título lima | ~20 |
| `sound.sfx_names` | 34,0–37,0 s | `impact_low` · `whoosh` · `key_click` · `ui_pop` · `glitch_crunch` · `snap` · `chime` | Pads de efectos que se iluminan uno por uno (cada uno con su forma de onda) | ~14 c/u |
| `hud.status.sound` | 34,0 s | `designing the sound` | Estado HUD | ~24 |

### 09 · THE EDITOR (0:38–0:44), rol 06/07, color celeste

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `role.editor.title` | 38,0 s | `the Editor` | Título celeste | ~16 |
| `editor.clips` | 38,0 s | `01 hook · 02 old way · 03 turn · 04 writer · 05 art · 06 animator · 07 composer · 08 sound · 09 editor · 10 render · 11 climax · 12 resolve` | Clips de colores que caen en la línea de tiempo V1. Pistas `score.wav`, `sfx.wav`, `room.wav`. | ~10 c/u |
| `editor.timecode` | 39,5–42,0 s | `00:00:00:00` → `00:01:08:15` | Timecode que corre con el cabezal | — |
| `editor.final_cut` | 42,0 s | `FINAL CUT · 12 SHOTS · 68.5 S` | La línea de tiempo se comprime en una sola barra con marcas de color | ~32 |
| `hud.status.editor` | 38,0 s | `cutting 12 shots` | Estado HUD | ~24 |

### 10 · THE RENDER (0:44–0:50), rol 07/07, color dorado

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `role.render.title` | 44,0 s | `the Render` | Título dorado | ~16 |
| `render.counter` | 44,0–48,0 s | `FRAME 0059 / 2055` → `2055 / 2055` · `2%` → `100%` | Grilla de 18 miniaturas que se van llenando (cada una se ilumina al renderizarse) y barra dorada | — |
| `render.specs` | 44,0 s | `1920×1080 · 30 fps · 68.5 s` | Subtítulo técnico | ~30 |
| `hud.status.render` | 44,0 s | `rendering 2,055 frames` → `render complete ✓` | Estado HUD | ~26 |
| — | 48,5–49,5 s | — | Destello blanco desde el centro (flare) que funde a crema: transición al acto 3 | — |

### 11 · CLIMAX (0:50–1:00): todo se ve junto

Destello → aparecen las tomas anteriores como "pantallas" flotando sobre fondo crema. Barrido rápido con motion blur, una cada ~0,5 s, cada una con su etiqueta. Al final, anillos de colores de los 7 roles colapsan y las tarjetas forman un anillo alrededor del título.

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `climax.tag_oldway` | 50,2 s | `THE OLD WAY` | Etiqueta bajo la tarjeta del caos | ~14 |
| `climax.tag_message` | 50,5 s | `ONE MESSAGE` | Etiqueta bajo la tarjeta del "Yes." | ~14 |
| `climax.tag_roles` | 51,0–53,3 s | `WRITER` · `ART` · `ANIMATION` · `SCORE` · `SOUND` | Etiqueta bajo cada tarjeta de rol (reusa los nombres del HUD) | ~12 |
| `climax.title` | 53,7 s | `One Conversation` | Título gigante en Fraunces sobre crema; 9 tarjetas orbitan desenfocadas | ~18 |
| `climax.credits` | 55,5–58,5 s | `the Writer` · `the Art Director` · `the Animator` · `the Composer` · `the Sound Designer` · `the Editor` · `the Render` | Créditos con punto de color y línea fina hacia el título; aparecen uno a uno como constelación | (reusa `role.*.title`) |

### 12 · RESOLVE (1:00–1:08,5): de vuelta a la conversación, ahora de día

| ID | Tiempo | Texto en pantalla | Qué hace la animación | Largo máx. |
|---|---|---|---|---|
| `hud.clock_end` | 60,0 s | `6:42 AM` | Hora en la tarjeta de chat (amaneció) | ~8 |
| `resolve.bubble_1` | 60,0 s | `I have an idea. I don't have a team.` | Burbuja del usuario (= `hook.typed`) | ~40 |
| `resolve.bubble_2` | 60,0 s | `Can you help me make it?` | Burbuja del usuario (= `turn.typed`) | ~30 |
| `resolve.reply` | 60,0 s | `Yes. Let's start with the story.` | Respuesta de Claude en Fraunces cursiva con punto naranja | ~36 |
| `resolve.files` | 60,5 s | `script.fdx` · `palette.json` · `motion.curves` · `score.wav` · `sfx.wav` · `edit.timeline` · `render.mp4` | 7 "chips" de archivo, uno por rol, con su color | ~14 c/u |
| `resolve.tagline` | 62,0–65,0 s | `Every frame you just watched` / `was made in one conversation.` | Frase en Fraunces cursiva (2 líneas). La tarjeta se desenfoca detrás. | ~32 por línea |
| `resolve.title` | 65,8 s | `One Conversation` | Título que se asienta debajo de la frase | ~18 |
| `resolve.signature` | 65,8 s | `Made with Claude Opus 5.5 · Part 3 of 3` | Firma en mono pequeña | ~42 |
| — | 65,0 s → fin | — | El input vacío vuelve a quedar abajo con el cursor parpadeando (cierra el círculo del hook) | — |

### HUD: reloj y contador (avanzan solos, se pueden cambiar)

| Toma | Reloj (`hud.clocks`) | Roles |
|---|---|---|
| hook / old way / turn | 2:07 AM | 0 / 7 |
| writer | 2:20 → 2:36 AM | 1 / 7 |
| art | 2:54 → 3:06 AM | 2 / 7 |
| animator | 3:28 AM | 3 / 7 |
| composer | 4:02 AM | 4 / 7 |
| sound | 4:36 AM | 5 / 7 |
| editor | 5:10 → 5:23 AM | 6 / 7 |
| render | 5:53 → 6:31 AM | 7 / 7 |
| resolve | 6:42 AM | — |

---

## 4. Sonido (a recomponer: el original llegó sin audio)

Lo que el propio video dice de su sonido: score a **120 BPM, 4/4** (`score.wav`), capa de efectos (`sfx.wav`) y ambiente (`room.wav`), con los efectos `impact_low`, `whoosh`, `key_click`, `ui_pop`, `glitch_crunch`, `snap` y `chime`. La forma de onda del Editor muestra un score bajo al inicio que crece hasta un pico en el clímax (toma 11) y baja en la resolución.

Plan de sincronía para la réplica (síntesis en código, mismo enfoque que el prompt original):

| Toma | Música | Efectos |
|---|---|---|
| hook | Drone grave + pad frío, casi silencio | `key_click` por letra, hum de habitación |
| old way | Pulso disonante que acelera | `ui_pop` por ventana, `glitch_crunch` en errores, `impact_low` en TOTAL, `glitch` en RENDER FAILED |
| turn | Corte a silencio, `key_click`, entra un acorde cálido en "Yes." | `whoosh` en el desenfoque, `chime` en la respuesta |
| roles 04–08 | Entra el beat a 120 BPM, se suma una capa por rol | `snap`/`whoosh` en cada título, sonido propio de cada rol |
| editor / render | Build-up, riser | ticks de timecode, `ui_pop` por miniatura |
| climax | Pico: tema completo, golpe en el flash | `whoosh` por tarjeta, `impact_low` en "One Conversation" |
| resolve | Pad cálido en mayor, se apaga | `chime` final, cursor |

---

## 5. Prompt de origen (fragmento recibido)

> You are the director, writer, animator, composer, sound designer and render engineer for a short story film made entirely in code. […] "One Conversation": at 2:07 AM a solo creator with a big idea and no team types one sentence, and an entire film studio wakes up inside the conversation. […] 60–75 seconds.
>
> Critique loop: render a contact sheet at every shot's midpoint, score every shot 1–10 for story clarity, composition, motion fluidity, typography, sync with music and sound, and polish. Write down the 3 worst problems, fix them, and repeat until every score is 8+ (max 4 rounds).

*(Falta el prompt completo; si llega, se agrega aquí.)*
