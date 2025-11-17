// import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';

// import { SpaceWarRoutingModule } from './space-war-routing.module';
// import { SpaceWarComponent } from './space-war.component';

// @NgModule({
//     imports: [SpaceWarComponent, CommonModule, SpaceWarRoutingModule],
// })
// export class SpaceWarModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpaceWarRoutingModule } from './space-war-routing.module';
import { SpaceWarComponent } from './space-war.component';

@NgModule({
    imports: [
        CommonModule, // modules standards d’abord
        SpaceWarRoutingModule, // routing du module
        SpaceWarComponent, // standalone component ensuite ✅
    ],
})
export class SpaceWarModule {}
