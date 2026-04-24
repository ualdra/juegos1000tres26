import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-lobby',
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
})
export class Lobby implements OnInit, OnDestroy {
  viewMode: 'lobby' | 'sala' = 'lobby';
  uuidInput = '';
  errorUuid = '';

  uuidActual = '';
  jugadorId = '';
  hostId = '';
  pantallaId = '';
  jugadores: JugadorResumen[] = [];
  esHost = false;

  juegosDisponibles = ['Juego 1', 'Juego 2', 'Juego 3'];

  private readonly apiBase = 'http://localhost:8082';
  private polling?: Subscription;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const uuid = params.get('uuid');

      this.detenerPolling();
      this.errorUuid = '';

      if (uuid) {
        this.viewMode = 'sala';
        this.uuidActual = uuid;
        this.jugadorId = sessionStorage.getItem('sala.jugadorId') || '';
        this.hostId = sessionStorage.getItem('sala.hostId') || '';
        this.actualizarEstado();
        this.iniciarPolling();
        return;
      }

      this.viewMode = 'lobby';
    });
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  crearSala(): void {
    this.errorUuid = '';

    this.http.get<SalaRespuesta>(`${this.apiBase}/sala/crear`).subscribe({
      next: respuesta => this.navegarSala(respuesta),
      error: () => {
        this.errorUuid = 'No se pudo crear la sala';
        this.cdr.detectChanges();
      }
    });
  }

  unirseSala(): void {
    const uuid = this.uuidInput.trim();

    if (!uuid) {
      this.errorUuid = 'Introduce un UUID';
      return;
    }

    this.errorUuid = '';

    this.http.get<SalaRespuesta>(`${this.apiBase}/sala/${uuid}/unirse`).subscribe({
      next: respuesta => this.navegarSala(respuesta),
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.errorUuid = 'uuid invalido';
          this.cdr.detectChanges();
          return;
        }

        this.errorUuid = 'No se pudo unir a la sala';
        this.cdr.detectChanges();
      }
    });
  }

  cambiarPantalla(jugadorId: string): void {
    if (!this.esHost || !this.uuidActual) {
      return;
    }

    const actorId = this.jugadorId;

    if (!actorId) {
      return;
    }

    this.http
      .post<SalaRespuesta>(
        `${this.apiBase}/sala/${this.uuidActual}/pantalla?actorId=${actorId}&jugadorId=${jugadorId}`,
        null
      )
      .subscribe({
        next: respuesta => this.actualizarDatos(respuesta),
        error: () => {
          this.errorUuid = 'No se pudo cambiar la pantalla';
          this.cdr.detectChanges();
        }
      });
  }

  salir(): void {
    if (!this.uuidActual) {
      return;
    }

    const uuid = this.uuidActual;
    const jugadorId = this.jugadorId;
    const request = this.esHost
      ? this.http.post<void>(`${this.apiBase}/sala/${uuid}/apagar`, null)
      : this.http.post<void>(`${this.apiBase}/sala/${uuid}/salir?jugadorId=${jugadorId}`, null);

    request.subscribe({
      next: () => this.limpiarSesion(),
      error: () => this.limpiarSesion()
    });
  }

  private navegarSala(respuesta: SalaRespuesta): void {
    if (!respuesta.uuid || !respuesta.jugadorId) {
      this.errorUuid = 'No se pudo entrar en la sala';
      return;
    }

    sessionStorage.setItem('sala.jugadorId', respuesta.jugadorId);
    sessionStorage.setItem('sala.hostId', respuesta.hostId);

    this.router.navigate(['/sala', respuesta.uuid]);
  }

  private actualizarEstado(): void {
    if (!this.uuidActual) {
      return;
    }

    this.http.get<SalaRespuesta>(`${this.apiBase}/sala/${this.uuidActual}/estado`).subscribe({
      next: respuesta => this.actualizarDatos(respuesta),
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.errorUuid = 'uuid invalido';
          this.cdr.detectChanges();
        }

        this.limpiarSesion();
      }
    });
  }

  private actualizarDatos(respuesta: SalaRespuesta): void {
    this.uuidActual = respuesta.uuid;
    this.jugadores = respuesta.jugadores || [];
    this.hostId = respuesta.hostId;
    this.pantallaId = respuesta.pantallaId || '';
    this.esHost = !!this.jugadorId && this.jugadorId === this.hostId;
    this.cdr.detectChanges();
  }

  private iniciarPolling(): void {
    this.polling = interval(3000).subscribe(() => this.actualizarEstado());
  }

  private detenerPolling(): void {
    if (this.polling) {
      this.polling.unsubscribe();
      this.polling = undefined;
    }
  }

  private limpiarSesion(): void {
    this.detenerPolling();
    sessionStorage.removeItem('sala.jugadorId');
    sessionStorage.removeItem('sala.hostId');
    this.router.navigate(['/sala']);
  }
}

interface JugadorResumen {
  id: string;
  nombre: string;
}

interface SalaRespuesta {
  uuid: string;
  jugadores: JugadorResumen[];
  hostId: string;
  pantallaId: string;
  jugadorId?: string;
}
