import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export enum View {
  Home,
  Dashboard,
  Leaderboard,
  Activity,
  Marketplace,
  Profile,
  Play,
}

export type AnimationState = 'idle' | 'exiting';

@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly _currentView = signal<View>(View.Home);
  public readonly currentView = this._currentView.asReadonly();

  private readonly _animationState = signal<AnimationState>('idle');
  public readonly animationState = this._animationState.asReadonly();

  private readonly _isFullscreen = signal(false);
  public readonly isFullscreen = this._isFullscreen.asReadonly();

  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('fullscreenchange', () =>
        this.onFullscreenChange()
      );
    }
  }

  private onFullscreenChange() {
    if (isPlatformBrowser(this.platformId)) {
      this._isFullscreen.set(!!document.fullscreenElement);
    }
  }

  // setView(view: View) {
  //   if (this.currentView() === view) return;

  //   this._animationState.set('exiting');

  //   setTimeout(() => {
  //     this._currentView.set(view);
  //     this._animationState.set('idle');
  //   }, 300); // Must match CSS animation duration
  // }

  setView(view: View) {
    if (this.currentView() === view) return;

    this._animationState.set('exiting');

    setTimeout(() => {
      this._currentView.set(view);
      this._animationState.set('idle');

      //FULLSCREEN behaviors
      if (view === View.Play) {
        this.enterFullscreen();

        //DISABLE SCROLL WHEN PLAYING THE GAME
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        this.exitFullscreen();

        //RESTORE SCROLL WHEN LEAVING GAME
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    }, 300);
  }

  async enterFullscreen() {
    if (!isPlatformBrowser(this.platformId)) return;
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        /* Firefox */
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        /* IE/Edge */
        await (elem as any).msRequestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  }

  async exitFullscreen() {
    if (!isPlatformBrowser(this.platformId) || !document.fullscreenElement)
      return;
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        /* Firefox */
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        /* IE/Edge */
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.error('Exit fullscreen failed:', err);
    }
  }
}
