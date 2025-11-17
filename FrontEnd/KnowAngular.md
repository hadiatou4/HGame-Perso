// projects/client/angular.json
{
"$schema": "../../node_modules/@angular/cli/lib/config/schema.json",
"version": 1,
"cli": {
"cache": {
"enabled": false
},
"analytics": false
},
"newProjectRoot": "projects",
"projects": {
"space-war": {
"projectType": "application",
"schematics": {},
"root": "",
"sourceRoot": "src",
"prefix": "app",
"architect": {
"build": {
"builder": "@angular-devkit/build-angular:browser",
"options": {
"outputPath": "dist/space-war",
"index": "src/index.html",
"main": "src/main.ts",
"polyfills": "src/polyfills.ts",
"tsConfig": "tsconfig.app.json",
"assets": [
"src/favicon.ico",
"src/assets",
"src/.nojekyll"
],
"styles": [
"../../node_modules/bootstrap/dist/css/bootstrap.min.css",
"src/styles.css"
],
"scripts": [
"../../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"
],
"vendorChunk": true,
"extractLicenses": false,
"buildOptimizer": false,
"sourceMap": true,
"optimization": false,
"namedChunks": true,
"commonChunk": false,
"allowedCommonJsDependencies": [
"phaser",
"phaser-ui-components",
"@mikewesthad/dungeon",
"dynamic-data-store"
]
},
"configurations": {
"production": {
"fileReplacements": [
{
"replace": "src/environments/environment.ts",
"with": "src/environments/environment.prod.ts"
}
],
"optimization": true,
"sourceMap": false,
"namedChunks": false,
"extractLicenses": true,
"vendorChunk": false,
"buildOptimizer": true,
"budgets": [
{
"type": "initial",
"maximumWarning": "2mb",
"maximumError": "5mb"
},
{
"type": "anyComponentStyle",
"maximumWarning": "6kb",
"maximumError": "10kb"
}
]
}
},
"defaultConfiguration": ""
},
"serve": {
"builder": "@angular-devkit/build-angular:dev-server",
"options": {
"buildTarget": "space-war:build",
"port": 4500,
"publicHost": "http://localhost:4500"
},
"configurations": {
"production": {
"buildTarget": "space-war:build:production"
}
}
},
"extract-i18n": {
"builder": "ngx-build-plus:extract-i18n",
"options": {
"buildTarget": "space-war:build",
"extraWebpackConfig": "webpack.config.cjs"
}
},
"test": {
"builder": "@angular-devkit/build-angular:karma",
"options": {
"main": "src/test.ts",
"polyfills": "src/polyfills.ts",
"tsConfig": "tsconfig.spec.json",
"karmaConfig": "karma.conf.js",
"assets": ["src/favicon.ico", "src/assets"],
"styles": ["src/styles.css"],
"scripts": []
}
},
"e2e": {
"builder": "@cypress/schematic:cypress",
"options": {
"devServerTarget": "space-war:serve",
"watch": true,
"headless": false
},
"configurations": {
"production": {
"devServerTarget": "space-war:serve:production"
}
}
},
"cypress-run": {
"builder": "@cypress/schematic:cypress",
"options": {
"devServerTarget": "space-war:serve"
},
"configurations": {
"production": {
"devServerTarget": "space-war:serve:production"
}
}
},
"cypress-open": {
"builder": "@cypress/schematic:cypress",
"options": {
"watch": true,
"headless": false
}
}
}
}
}
}

// package.json
{
"name": "space-war",
"workspaces": [
"projects/shared",
"projects/server",
"projects/client"
],
"scripts": {
"clean": "rimraf ./dist && rimraf ./docs",
"build": "npm run build --workspaces --if-present && npm run copy-dist-to-root && npm run copy-docs-to-root",
"build:dev": "npm run build:dev --workspaces --if-present",
"copy-dist-to-root": "copyfiles -u 3 \"./projects/**/dist/**/_\" ./dist/",
"copy-docs-to-root": "copyfiles -u 3 \"./projects/**/docs/**/_\" ./docs/",
"test": "npm run test --workspaces --if-present",
"start": "npm run start --workspaces --if-present",
"start:dev": "npm run start:dev --workspaces --if-present",
"test:shared": "npm run test -w space-war-shared"
},
"devDependencies": {
"copyfiles": "^2.4.1",
"dpdm": "^3.9.0",
"lerna": "^5.5.2",
"ngx-build-plus": "^20.0.0",
"rimraf": "^3.0.2",
"typescript": "^5.9.3"
},
"private": true,
"engines": {
"node": ">=20"
}
}

// projects/client/src/app/app.module.ts

import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
imports: [
BrowserModule,
AppRoutingModule,
AppComponent, // ✅ On importe le standalone component ici
],
providers: [
{ provide: APP_BASE_HREF, useValue: `${environment.baseHref}` },
],
bootstrap: [AppComponent],
})
export class AppModule {}

// projects/client/src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
{
path: '',
loadChildren: () =>
import('./space-war/space-war.module').then(
(m) => m.SpaceWarModule
),
},
{ path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
imports: [RouterModule.forRoot(routes)],
exports: [RouterModule],
})
export class AppRoutingModule {}

// projects/client/src/environments/environment.ts
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
production: false,
baseUrl: 'http://localhost:4500',
baseHref: '/',
websocket: 'ws://localhost:8081',
};

/\*

- For easier debugging in development mode, you can import the following file
- to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
-
- This import should be commented out in production mode because it will have a negative impact
- on performance if an error is thrown.
  \*/
  // import 'zone.js/plugins/zone-error'; // Included with Angular CLI.

// projects/client/src/environments/environment.prod.ts

export const environment = {
production: true,
baseUrl: 'https://hedera-gaming.github.io/SpaceWar',
baseHref: '/SpaceWar',
websocket: 'wss://space-war-server.onrender.com',
};

//projects/client/src/app/app.component.ts

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
selector: 'app-root-space',
imports: [RouterOutlet], // ✅ Ajout ici

    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],

})
export class AppComponent {
title = 'space-war';
}

// projects/client/src/app/app.component.html
<router-outlet></router-outlet>

//\***\*\*\*\*\***\*\*\*\*\***\*\*\*\*\***\*\*\*\***\*\*\*\*\***\*\*\*\*\***\*\*\*\*\***

//C:\Users\Hp\SpaceShip-War\src\app.component.ts

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from './services/wallet.service';
import { UiService, View } from './services/ui.service';

import { WalletConnectModalComponent } from './components/wallet-connect-modal/wallet-connect-modal.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { GameDashboardComponent } from './components/game-dashboard/game-dashboard.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { ContractActivityFeedComponent } from './components/contract-activity-feed/contract-activity-feed.component';
import { GameScreenComponent } from './components/game-screen/game-screen.component';
import { MarketplaceComponent } from './components/marketplace/marketplace.component';
import { ProfileComponent } from './components/profile/profile.component';

@Component({
selector: 'app-root',
templateUrl: './app.component.html',
changeDetection: ChangeDetectionStrategy.OnPush,
standalone: true,
imports: [
CommonModule,
WalletConnectModalComponent,
NavbarComponent,
HomeComponent,
GameDashboardComponent,
LeaderboardComponent,
ContractActivityFeedComponent,
GameScreenComponent,
MarketplaceComponent,
ProfileComponent
],
})
export class AppComponent {
walletService = inject(WalletService);
uiService = inject(UiService);

isModalOpen = this.walletService.isConnectModalOpen;
currentView = this.uiService.currentView;
animationState = this.uiService.animationState;

View = View; // Expose enum to template
}

// C:\Users\Hp\SpaceShip-War\src\app.component.html

<div class="min-h-screen text-neutral-200">
  <!-- Le modal Reown est géré automatiquement par le service -->
  <app-wallet-connect-modal />

  <div class="flex flex-col h-screen">
    <app-navbar />
    <main
      class="flex-grow p-4 md:p-8 overflow-y-auto"
      [class.animate-fade-out-up]="animationState() === 'exiting'"
    >
      <div class="animate-fade-in">
        @switch (currentView()) { @case (View.Home) {
        <app-home />
        } @case (View.Dashboard) {
        <app-game-dashboard />
        } @case (View.Leaderboard) {
        <app-leaderboard />
        } @case (View.Activity) {
        <app-contract-activity-feed />
        } @case (View.Marketplace) {
        <app-marketplace />
        } @case (View.Profile) {
        <app-profile />
        } @case (View.Play) {
        <app-game-screen />
        } }
      </div>
    </main>
  </div>
</div>

//C:\Users\Hp\SpaceShip-War\angular.json
{
"$schema": "./node_modules/@angular/cli/lib/config/schema.json",
"version": 1,
"newProjectRoot": "",
"projects": {
"app": {
"projectType": "application",
"root": "",
"sourceRoot": "./",
"prefix": "app",
"architect": {
"build": {
"builder": "@angular/build:application",
"options": {
"outputPath": {
"base": "./dist",
"browser": "."
},
"browser": "index.tsx",
"tsConfig": "tsconfig.json"
},
"configurations": {
"production": {
"outputHashing": "all"
},
"development": {
"optimization": false,
"extractLicenses": false,
"sourceMap": true
}
},
"defaultConfiguration": "production"
},
"serve": {
"builder": "@angular/build:dev-server",
"options": {
"port": 3000
},
"configurations": {
"production": {
"buildTarget": "app:build:production"
},
"development": {
"buildTarget": "app:build:development"
}
},
"defaultConfiguration": "development"
}
}
}
},
"cli": {
"analytics": false
}
}

//C:\Users\Hp\SpaceShip-War\index.tsx

import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './src/app.component';

bootstrapApplication(AppComponent, {
providers: [
provideZonelessChangeDetection(),
provideHttpClient(),
],
}).catch(err => console.error(err));

// C:\Users\Hp\SpaceShip-War\package.json

{
"name": "spaceship-war",
"private": true,
"version": "0.0.0",
"type": "module",
"scripts": {
"prestart": "node --loader ts-node/esm scripts/generate-env.mjs",
"dev": "ng serve",
"build": "ng build",
"preview": "ng serve --configuration=production"
},
"dependencies": {
"@angular/build": "^20.3.0",
"@angular/cli": "^20.3.10",
"@angular/common": "^20.3.12",
"@angular/compiler": "^20.3.12",
"@angular/compiler-cli": "^20.3.0",
"@angular/core": "^20.3.12",
"@angular/forms": "^20.3.11",
"@angular/platform-browser": "^20.3.12",
"@hashgraph/sdk": "^2.77.0",
"@reown/appkit": "^1.8.14",
"@reown/appkit-adapter-wagmi": "^1.8.14",
"@supabase/supabase-js": "2",
"@wagmi/core": "^2.22.1",
"rxjs": "^7.8.2",
"sonner": "^2.0.7",
"tailwindcss": "latest",
"viem": "^2.39.0"
},
"devDependencies": {
"@types/node": "^22.14.0",
"dotenv": "^17.2.3",
"dotenv-webpack": "^8.1.1",
"ngx-build-plus": "^20.0.0",
"typescript": "~5.8.2",
"vite": "^6.2.0"
}
}
