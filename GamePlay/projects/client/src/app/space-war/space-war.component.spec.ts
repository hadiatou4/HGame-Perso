import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceWarComponent } from './space-war.component';

describe('SpaceWarComponent', () => {
    let component: SpaceWarComponent;
    let fixture: ComponentFixture<SpaceWarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SpaceWarComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SpaceWarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
