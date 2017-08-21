import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { IBreadcrumbRouterLink } from 'gentics-ui-core';

import { MeshNode } from '../../../common/models/node.model';
import { ApplicationStateService } from '../../../state/providers/application-state.service';
import { NavigationService } from '../../../core/providers/navigation/navigation.service';
import { Project } from '../../../common/models/project.model';
import { EntitiesService } from '../../../state/providers/entities.service';

@Component({
    selector: 'breadcrumbs',
    templateUrl: './breadcrumbs.component.html',
    styleUrls: ['./breadcrumbs.scss']
})
export class BreadcrumbsComponent {
    routerLinks$: Observable<IBreadcrumbRouterLink[]>;

    constructor(private state: ApplicationStateService,
                private entities: EntitiesService,
                private navigationService: NavigationService) {
        this.routerLinks$ = state.select(state => state.list.currentNode)
            .map(nodeUuid => {
                if (nodeUuid) {
                    return entities.getNode(nodeUuid) || undefined;
                }
            })
            .map(node => this.toRouterLinks(node));
    }

    /**
     * Turns a node to breadcrumb router links, which are used for the gtx-breadcrumbs directive.
     * @param node A node in mesh containing the breadcrumb information.
     */
    private toRouterLinks(node: MeshNode | undefined): IBreadcrumbRouterLink[] {
        const currentProject = this.state.now.list.currentProject;
        const project = this.getProjectByName(currentProject);
        if (!currentProject || !project) {
            return [];
        }
        const rootNodeLink: IBreadcrumbRouterLink = {
            route: this.navigationService.list(project.name, project.rootNode.uuid).commands(),
            text: project.name
        };
        if (!node) {
            return [rootNodeLink];
        }

        const breadcrumbs = node.breadcrumb.map(ascendant => ({
            route: this.navigationService.list(project.name, ascendant.uuid).commands(),
            text: ascendant.displayName!
        }));

        // TODO: currently Mesh returns the breadcrumbs reversed, but this behaviour will change in
        // the future. At that time, this line may be removed.
        breadcrumbs.reverse();

        const fullBreadcrumbs = [rootNodeLink, ...breadcrumbs];

        if (node.uuid !== project.rootNode.uuid) {
            const selfName = node.displayField ? node.fields[node.displayField] : node.uuid;
            const selfLink: IBreadcrumbRouterLink = {
                route: this.navigationService.list(project.name, node.uuid).commands(),
                text: selfName
            };
            fullBreadcrumbs.push(selfLink);
        }

        return fullBreadcrumbs;
    }

    private getProjectByName(projectName: string | undefined): Project | undefined {
        if (!projectName) {
            return;
        }
        const projects = this.state.now.entities.project;
        const match = Object.keys(projects)
            .map(uuid => projects[uuid])
            .find(project => project.name === projectName);
        return match;
    }
}
