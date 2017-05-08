import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { routes } from './admin.routes';
import { SharedModule } from '../shared/shared.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { ProjectListItemComponent } from './components/project-list-item/project-list-item.component';

@NgModule({
    declarations: [
        DashboardComponent,
        ProjectListComponent,
        ProjectListItemComponent
    ],
    imports: [
        SharedModule,
        RouterModule.forChild(routes),
    ],
})
export class AdminModule {
    public static routes = routes;
}
