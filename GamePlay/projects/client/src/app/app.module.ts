import { APP_BASE_HREF } from '@angular/common';
import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
    imports: [
        BrowserModule,
        AppRoutingModule,
        AppComponent, // ✅ ton AppComponent standalone
    ],
    providers: [
        { provide: APP_BASE_HREF, useValue: `${environment.baseHref}` },

        // 👉 Ajout des providers Angular modernes
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideHttpClient(),
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
