import { Component, OnInit } from '@angular/core';
import { ApplicationStateService } from '../../../state/providers/application-state.service';
import { Observable } from 'rxjs/Observable';
import { NavigationService } from '../../../core/providers/navigation/navigation.service';
import { Project } from '../../../common/models/project.model';
import { ListEffectsService } from '../../../core/providers/effects/list-effects.service';

@Component({
    selector: 'master-detail',
    templateUrl: './master-detail.component.html',
    styleUrls: ['./master-detail.scss']
})
export class MasterDetailComponent implements OnInit {

    editorFocused$: Observable<boolean>;
    editorOpen$: Observable<boolean>;

    constructor(private state: ApplicationStateService,
                private listEffects: ListEffectsService,
                private navigationService: NavigationService) {
        this.editorFocused$ = state.select(state => state.editor.editorIsFocused);
        this.editorOpen$ = state.select(state => state.editor.editorIsOpen);
    }

    ngOnInit(): void {
        this.listEffects.loadProjects();

        // TODO: We need to determine a "default" project to load up on init, fetch it from the
        // API and navigate to its baseNode.
        // this.navigationService.list('demo', 'container_uuid').navigate();
        this.state.select(state => state.auth.loggedIn)
            .filter(Boolean)
            .switchMap(() => this.state.select(state => {
                const projects = state.entities.project;
                const firstProjectUuid = Object.keys(projects)[0];
                return firstProjectUuid && projects[firstProjectUuid];
            }))
            .filter(Boolean)
            .take(1)
            .subscribe((firstProject: Project) => {
                this.navigationService.list(firstProject.name, firstProject.rootNode.uuid).navigate();
            });
    }

    setSplitFocus(focus: 'left' | 'right'): void {
        if (focus === 'right') {
            this.state.actions.editor.focusEditor();
        } else {
            this.state.actions.editor.focusList();
        }
    }

}
