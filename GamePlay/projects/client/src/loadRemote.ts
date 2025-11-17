import 'zone.js';
import { enableProdMode, getPlatform } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

const platform = getPlatform() ?? platformBrowser();

platform.bootstrapModule(AppModule).catch((err) => console.error(err));
