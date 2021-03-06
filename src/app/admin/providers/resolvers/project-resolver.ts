import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Injectable } from '@angular/core';

import { Project } from '../../../common/models/project.model';
import { BreadcrumbTextFunction } from '../../components/admin-breadcrumbs/admin-breadcrumbs.component';
import { AdminProjectEffectsService } from '../effects/admin-project-effects.service';


@Injectable()
export class ProjectResolver implements Resolve<Project> {

    constructor(private adminProjectEffects: AdminProjectEffectsService ) {}

    resolve(route: ActivatedRouteSnapshot): Promise<Project> {
        const uuid = route.paramMap.get('uuid');
        if (!uuid) {
            throw new Error(`Could not find a project with the uuid "${uuid}"`);
        }

        return this.adminProjectEffects.openProject(uuid)
            .then((project) => {
                if (!project) {
                    // throw
                    throw new Error(`Could not find a project with the uuid "${uuid}"`);
                }
                return project!;
            });
    }
}

export const projectBreadcrumbFn: BreadcrumbTextFunction = (route, state, entities) =>  {
    const uuid = state.adminProjects.projectDetail;
    if (!uuid) {
        return 'admin.new_project';
    } else {
        return entities.selectProject(uuid)
            .map(project => {
                return `${project.name}`;
            });
    }
};
