import { Route } from '@angular/router';

import { AdminShellComponent } from './components/admin-shell/admin-shell.component';
import { MicroschemaDetailComponent } from './components/microschema-detail/microschema-detail.component';
import { MicroschemaListComponent } from './components/microschema-list/microschema-list.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { SchemaDetailComponent } from './components/schema-detail/schema-detail.component';
import { SchemaListComponent } from './components/schema-list/schema-list.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { microschemaBreadcrumbFn, MicroschemaResolver } from './providers/resolvers/microschema-resolver';
import { projectBreadcrumbFn, ProjectResolver } from './providers/resolvers/project-resolver';
import { schemaBreadcrumbFn, SchemaResolver } from './providers/resolvers/schema-resolver';
import { userBreadcrumbFn, UserResolver } from './providers/resolvers/user-resolver';

export const routes: Route[] = [
    {
        path: '',
        component: AdminShellComponent,
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'projects' },
            {
                path: 'projects',
                data: { breadcrumb: 'common.projects' },
                children: [
                    { path: '', component: ProjectListComponent },
                    {
                        path: ':uuid',
                        component: ProjectDetailComponent,
                        resolve: { project: ProjectResolver },
                        data: { breadcrumb: projectBreadcrumbFn }
                    }
                ]
            },
            {
                path: 'microschemas',
                data: { breadcrumb: 'common.microschemas' },
                children: [
                    { path: '', component: MicroschemaListComponent },
                    {
                        path: ':uuid',
                        component: MicroschemaDetailComponent,
                        resolve: { microschema: MicroschemaResolver },
                        data: { breadcrumb: microschemaBreadcrumbFn }
                    }
                ]
            },
            {
                path: 'schemas',
                data: { breadcrumb: 'common.schemas' },
                children: [
                    { path: '', component: SchemaListComponent },
                    {
                        path: ':uuid',
                        component: SchemaDetailComponent,
                        resolve: { schema: SchemaResolver },
                        data: { breadcrumb: schemaBreadcrumbFn }
                    }
                ]
            },
            {
                path: 'users',
                data: { breadcrumb: 'common.users' },
                children: [
                    { path: '', component: UserListComponent },
                    {
                        path: ':uuid',
                        component: UserDetailComponent,
                        resolve: { user: UserResolver },
                        data: { breadcrumb: userBreadcrumbFn }
                    }
                ]
            }
        ]
    }
];
