````markdown
# ⚽👤 Juego Impostor de Fútbol

Aplicación web desarrollada con **React, Node.js, Express, MySQL y Sequelize**.  
Se trata de un juego multijugador inspirado en la dinámica de "impostor", pero ambientado en el mundo del fútbol.  

---

## 📖 Descripción del juego

Cada partida se juega en una **sala**. Los jugadores pueden unirse con un **nickname temporal** (no hay registro de usuarios).  

El creador de la sala configura:
- Nombre de la sala  
- Contraseña opcional  
- Cantidad máxima de jugadores  
- Cantidad de impostores (1 o 2)  
- Tiempo en segundos por turno (solo online)  
- Modalidad: **online** o **presencial**  
- Tipo de juego: **jugadores** o **equipos de fútbol**  

Al iniciar la partida:
- El sistema selecciona un jugador/equipo de la base de datos  
- Se asigna **un impostor aleatorio** (o dos)  
- El resto recibe el mismo jugador/equipo  

### Dinámica
- Los jugadores escriben (o dicen, en presencial) una palabra relacionada con el futbolista/equipo  
- El impostor también aporta una palabra, intentando disimular  
- Después de cada ronda, los jugadores **votan para eliminar** a un sospechoso  
- El juego continúa hasta que se cumplan las condiciones de victoria  

### Condiciones de victoria
- **Impostor(es):**
  - 1 impostor gana cuando queda él y un jugador más  
  - 2 impostores ganan cuando quedan 2 impostores + 2 jugadores  
  - Si queda 1 de los 2 impostores, aplica la regla de 1 impostor  
- **Jugadores:** ganan si logran eliminar a todos los impostores  

---

## 🛠️ Tecnologías usadas
- **Frontend:** React + Vite  
- **Backend:** Node.js + Express  
- **Base de datos:** MySQL + Sequelize  
- **Persistencia:**  
  - Jugadores/equipos en BD  
  - Datos de partida en memoria (se eliminan al terminar)  

---

## 🚀 Cómo ejecutar el proyecto

### 1. Clonar repositorio
```bash
git clone https://github.com/tuusuario/impostor-futbol.git
cd impostor-futbol
````

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Base de datos

* Crear BD en MySQL
* Configurar `.env` en backend con credenciales
* Ejecutar migraciones con Sequelize

---

## 📌 User Stories

### 🏗 Epic 1: Gestión de salas

* **US1:** Ingresar nickname temporal
* **US2:** Crear sala con configuración (nombre, contraseña, max jugadores, impostores, modalidad, tipo de juego)
* **US3:** Unirse a una sala existente
* **US4:** Iniciar la partida como creador
* **US5:** Ver lista de jugadores conectados

### 🎲 Epic 2: Asignación de roles y setup de partida

* **US6:** Asignar aleatoriamente impostores
* **US7:** Asignar jugador/equipo al resto desde la BD
* **US8:** Impostor ve su rol
* **US9:** Jugadores ven su jugador/equipo
* **US10:** Orden aleatorio inicial de turnos

### 🖊 Epic 3: Rondas de palabras

* **US11:** Input de texto para palabras (modo online)
* **US12:** Temporizador de turnos online
* **US13:** Modalidad presencial: solo orden de turnos
* **US14:** Tabla con nicknames y palabras
* **US15:** Impostor también escribe palabra

### 🗳 Epic 4: Votación

* **US16:** Botones de votar debajo de cada nombre
* **US17:** 120 segundos para votar (online)
* **US18:** Si no vota, su voto es nulo
* **US19:** Eliminar al jugador con más votos
* **US20:** En caso de empate, nueva ronda hasta desempatar

### ⚔ Epic 5: Condiciones de victoria

* **US21:** Reglas de victoria de impostores
* **US22:** Reglas de victoria de jugadores

### 🔄 Epic 6: Gestión de rondas y reinicio

* **US23:** Mostrar impostor y jugador/equipo al final
* **US24:** Jugar otra partida en la misma sala
* **US25:** Rotar orden de turnos en partidas siguientes
* **US26:** Asignar impostores aleatoriamente cada vez

### 💾 Epic 7: Persistencia y datos

* **US27:** BD solo con jugadores/equipos
* **US28:** Resto de datos en memoria (limpiar al finalizar)

### 🌐 Epic 8: Interfaz y experiencia

* **US29:** Pantalla inicial con opciones claras: unirse/crear sala
* **US30:** Interfaz clara durante la partida (rol, jugador, tabla, timer)
* **US31:** Resumen final con roles y ganador

---

## 📋 Product Backlog Priorizado

### 🥇 Fase 1: MVP básico

* US1, US2, US3, US5, US4, US6, US7, US8, US9, US10
* US11, US14, US15, US16, US19, US21, US22, US23

👉 Resultado: partida jugable online (sin timer ni empates)

### 🥈 Fase 2: Mejoras clave

* US12, US13, US17, US18, US20, US25

👉 Resultado: experiencia completa online/presencial

### 🥉 Fase 3: Experiencia completa

* US24, US26, US27, US28, US29, US30, US31

👉 Resultado: juego rejugable y pulido

---



```
