package com.juegos1000tres.juegos1000tres_backend.sala;

import com.juegos1000tres.juegos1000tres_backend.modelos.Jugador;
import com.juegos1000tres.juegos1000tres_backend.modelos.Sala;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class SalaRoom {

    private final String uuid;
    private final Sala sala;
    private final String creadorId;
    private String pantallaId;
    private int contadorNombres = 1;

    public SalaRoom(String uuid, Sala sala, String creadorId) {
        this.uuid = Objects.requireNonNull(uuid, "uuid requerido");
        this.sala = Objects.requireNonNull(sala, "sala requerida");
        this.creadorId = Objects.requireNonNull(creadorId, "creador requerido");
        this.pantallaId = creadorId;
    }

    public synchronized Jugador agregarJugador(String nombre) {
        String nombreFinal = (nombre == null || nombre.isBlank())
                ? "Jugador " + contadorNombres++
                : nombre.trim();
        Jugador jugador = new Jugador(nombreFinal);
        sala.agregarJugador(jugador);
        return jugador;
    }

    public synchronized void eliminarJugador(String jugadorId) {
        UUID id = UUID.fromString(jugadorId);
        sala.eliminarJugador(id);

        if (jugadorId.equals(pantallaId)) {
            pantallaId = sala.getHost() != null ? sala.getHost().getId().toString() : "";
        }
    }

    public synchronized void cambiarPantalla(String actorId, String jugadorId) {
        if (!creadorId.equals(actorId)) {
            throw new SecurityException("Solo el creador puede cambiar la pantalla");
        }

        UUID id = UUID.fromString(jugadorId);
        boolean existe = sala.getJugadores().stream()
                .anyMatch(jugador -> jugador.getId().equals(id));

        if (!existe) {
            throw new IllegalArgumentException("Jugador no encontrado");
        }

        pantallaId = jugadorId;
    }

    public boolean esCreador(String jugadorId) {
        return creadorId.equals(jugadorId);
    }

    public boolean isAbierta() {
        return sala.isAbierta();
    }

    public String getUuid() {
        return uuid;
    }

    public List<Jugador> getJugadores() {
        return sala.getJugadores();
    }

    public String getHostId() {
        return sala.getHost() == null ? "" : sala.getHost().getId().toString();
    }

    public String getPantallaId() {
        return pantallaId;
    }
}
