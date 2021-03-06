import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService } from 'gentics-ui-core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { combineLatest } from 'rxjs/observable/combineLatest';

import { Project } from '../../../common/models/project.model';
import { Schema } from '../../../common/models/schema.model';
import { SchemaResponse } from '../../../common/models/server-models';
import { fuzzyMatch } from '../../../common/util/fuzzy-search';
import { notNullOrUndefined } from '../../../common/util/util';
import { I18nService } from '../../../core/providers/i18n/i18n.service';
import { observeQueryParam } from '../../../shared/common/observe-query-param';
import { setQueryParams } from '../../../shared/common/set-query-param';
import { ProjectAssignments } from '../../../state/models/admin-schemas-state.model';
import { ApplicationStateService } from '../../../state/providers/application-state.service';
import { EntitiesService } from '../../../state/providers/entities.service';
import { AdminProjectEffectsService } from '../../providers/effects/admin-project-effects.service';
import { AdminSchemaEffectsService } from '../../providers/effects/admin-schema-effects.service';
import { MarkerData } from '../monaco-editor/monaco-editor.component';

@Component({
    templateUrl: './schema-detail.component.html'
})
export class SchemaDetailComponent implements OnInit, OnDestroy {
    // TODO Disable save button when editor is pristine
    // TODO Show message on save when schema has not changed
    projects: Project[];

    filterTerm: string;

    filterInput = new FormControl('');

    projects$: Observable<Project[]>;
    allProjects$: Observable<Project[]>;

    schema$: Observable<SchemaResponse>;
    version: string;

    projectAssignments?: ProjectAssignments;

    uuid$: Observable<string>;
    schemaJson = '';
    // TODO load json schema from mesh instead of static file
    schema = require('./schema.schema.json');
    errors: MarkerData[] = [];
    isNew = true;
    private subscription: Subscription;

    constructor(
        private state: ApplicationStateService,
        private entities: EntitiesService,
        private modal: ModalService,
        private i18n: I18nService,
        public adminProjectEffects: AdminProjectEffectsService,
        private schemaEffects: AdminSchemaEffectsService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        this.schema$ = this.route.data.map(data => data.schema).do((schema: Schema) => {
            this.isNew = !schema;
        });

        this.subscription = this.schema$.subscribe(schema => {
            this.schemaJson = schema ? JSON.stringify(stripSchemaFields(schema), undefined, 4) : `{}`;
        });

        this.schema$
            .filter(schema => !!schema)
            .take(1)
            .toPromise()
            .then(schema => {
                this.version = schema.version;
                this.schemaEffects
                    .loadEntityAssignments('schema', schema.uuid)
                    .then(assignments => (this.projectAssignments = assignments));
            });

        this.adminProjectEffects.loadProjects();

        this.filterInput.valueChanges.debounceTime(100).subscribe(term => {
            setQueryParams(this.router, this.route, { q: term });
        });

        observeQueryParam(this.route.queryParamMap, 'q', '').subscribe(filterTerm => {
            this.adminProjectEffects.setFilterTerm(filterTerm);
            this.filterInput.setValue(filterTerm, { emitEvent: false });
        });

        this.allProjects$ = this.state
            .select(state => state.adminProjects.projectList)
            .map(uuids => uuids.map(uuid => this.entities.getProject(uuid)).filter(notNullOrUndefined));

        const filterTerm$ = this.state.select(state => state.adminProjects.filterTerm);

        this.projects$ = combineLatest(this.allProjects$, filterTerm$).map(([projects, filterTerm]) => {
            this.filterTerm = filterTerm;
            return projects.filter(project => fuzzyMatch(filterTerm, project.name) !== null).sort((pro1, pro2) => {
                return pro1.name < pro2.name ? -1 : 1;
            });
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    onErrorChange(errors: MarkerData[]) {
        this.errors = errors;
    }

    save() {
        if (this.errors.length === 0) {
            const changedSchema = JSON.parse(this.schemaJson);
            if (this.isNew) {
                this.schemaEffects.createSchema(changedSchema).then(schema => {
                    if (schema) {
                        this.router.navigate(['admin', 'schemas', schema.uuid]);
                        this.version = schema.version;
                    }
                });
            } else {
                this.schema$.take(1).subscribe(schema => {
                    this.schemaEffects.updateSchema({ ...schema, ...changedSchema }).then(schemaNew => {
                        if (schemaNew) {
                            this.version = schemaNew.version;
                        }
                    });
                });
            }
        }
    }

    delete() {
        this.schema$
            .take(1)
            .switchMap(schema => this.schemaEffects.deleteSchema(schema.uuid))
            .subscribe(() => this.router.navigate(['admin', 'schemas']));
    }

    onAssignmentChange(project: Project, isChecked: boolean) {
        if (isChecked) {
            this.schema$
                .take(1)
                .subscribe(schema => this.schemaEffects.assignEntityToProject('schema', schema.uuid, project.name));
        } else {
            this.schema$
                .take(1)
                .subscribe(schema => this.schemaEffects.removeEntityFromProject('schema', schema.uuid, project.name));
        }

        if (this.projectAssignments) {
            this.projectAssignments[project.uuid] = isChecked;
        }
    }
}

const updateFields: Array<keyof SchemaResponse> = ['name', 'description', 'fields'];

function stripSchemaFields(schema: SchemaResponse): any {
    return updateFields.reduce((obj, key) => ({ ...obj, [key]: schema[key] }), {});
}
