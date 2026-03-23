import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-mfe-unavailable',
  template: `
    <style>
      .mfe-err {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 56px);
        background: #f1f5f9;
        gap: 1.25rem;
        padding: 2rem;
        text-align: center;
      }
      .mfe-err-icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: #fff7ed;
        border: 2.5px solid #fed7aa;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: #f58634;
      }
      .mfe-err h2 {
        font-size: 1.35rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }
      .mfe-err p {
        color: #64748b;
        font-size: 0.95rem;
        max-width: 400px;
        margin: 0;
        line-height: 1.6;
      }
      .mfe-err-badge {
        background: #fee2e2;
        color: #dc2626;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 20px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .mfe-err-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.4rem;
        background: linear-gradient(135deg, #2b5290, #1a3a6e);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .mfe-err-btn:hover { opacity: 0.88; }
    </style>

    <div class="mfe-err">
      <div class="mfe-err-icon">⚠</div>
      <span class="mfe-err-badge">Servicio no disponible</span>
      <h2>Este módulo no está disponible</h2>
      <p>
        El servidor de este módulo no está corriendo o no se puede alcanzar.
        Los demás módulos del sistema siguen funcionando con normalidad.
      </p>
      <button class="mfe-err-btn" (click)="retry()">
        ↺ Reintentar
      </button>
    </div>
  `,
})
export class MfeUnavailableComponent {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  retry() {
    const url = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
      this.router.navigateByUrl(url)
    );
  }
}
