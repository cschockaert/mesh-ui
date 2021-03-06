import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GenticsUICoreModule } from 'gentics-ui-core';
import { Observable } from 'rxjs/Observable';

import { AppComponent } from './app.component';
import { ConfigService } from './core/providers/config/config.service';
import { SharedModule } from './shared/shared.module';
import { ApplicationStateDevtools } from './state/providers/application-state-devtools';
import { ApplicationStateService } from './state/providers/application-state.service';

describe(`App`, () => {
    let comp: AppComponent;
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [SharedModule, GenticsUICoreModule.forRoot()],
            declarations: [AppComponent],
            providers: [
                ApplicationStateService,
                ApplicationStateDevtools,
                ConfigService,
                { provide: Router, useClass: MockRouter }
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AppComponent);
        comp = fixture.componentInstance;

        fixture.detectChanges();
    });

    it(`should be readly initialized`, () => {
        expect(fixture).toBeDefined();
        expect(comp).toBeDefined();
    });
});

class MockRouter {
    events = Observable.never();
}
