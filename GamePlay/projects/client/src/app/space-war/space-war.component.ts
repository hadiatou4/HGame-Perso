import {
    Component,
    HostListener,
    NgZone,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { SpaceWarClient } from './game/space-war-client';

@Component({
    selector: 'app-space-war',
    templateUrl: './space-war.component.html',
    styleUrls: ['./space-war.component.css'],
})
export class SpaceWarComponent implements OnInit, OnDestroy {
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        SpaceWarClient.resize();
    }

    constructor(private zone: NgZone) {}

    ngOnInit(): void {
        this.zone.runOutsideAngular(() => {
            SpaceWarClient.start({
                debug: false,
                loglevel: 'warn',
            });
        });
    }

    ngOnDestroy(): void {
        SpaceWarClient.stop();
    }
}
