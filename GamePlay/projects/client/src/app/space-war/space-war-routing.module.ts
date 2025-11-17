import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SpaceWarComponent } from './space-war.component';

const routes: Routes = [
    { path: '', component: SpaceWarComponent },
    { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class SpaceWarRoutingModule {}
