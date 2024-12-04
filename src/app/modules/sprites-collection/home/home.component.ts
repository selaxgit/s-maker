import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap } from '@angular/router';

import {
  IDropToNodeEvent,
  SMCHeaderComponent,
  SMCPageNotFoundComponent,
  SMCTreeComponent,
} from '../../../common/components';
import { APP_TITLE, SPRITES_COLLECTION_MODULE } from '../../../common/constants';
import { IProject } from '../../../common/interfaces';
import { SpritesService, SpritesTreeDBService } from '../../../common/services/sprites';
import { TreeService } from '../../../common/services/tree';
import { ProjectStore, TreeStore } from '../../../stores';
import { SCSpritesListComponent } from '../sprites-list/sprites-list.component';

@Component({
    selector: 'sc-home',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        SMCHeaderComponent,
        SMCPageNotFoundComponent,
        SMCTreeComponent,
        SCSpritesListComponent,
    ],
    providers: [TreeService, TreeStore],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCHomeComponent {
  readonly currentModule = SPRITES_COLLECTION_MODULE;

  readonly isInitializing = this.projectStore.isInitializing$;

  readonly project$ = this.projectStore.project$;

  constructor(
    private readonly titleService: Title,
    private readonly activatedRoute: ActivatedRoute,
    private readonly projectStore: ProjectStore,
    private readonly treeService: TreeService,
    private readonly spritesTreeDBService: SpritesTreeDBService,
    private readonly spritesService: SpritesService,
  ) {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed()).subscribe((params: ParamMap) => {
      this.projectStore.initialize(params.get('pid'));
    });
    this.project$.pipe(takeUntilDestroyed()).subscribe((project: IProject | null) => {
      if (project) {
        this.titleService.setTitle(`${this.currentModule.name} | ${project.name ?? ''} | ${APP_TITLE}`);
      }
    });
    this.treeService.setBaseService(this.spritesTreeDBService);
  }

  onSpriteToTreeNode(event: IDropToNodeEvent): void {
    this.spritesService.update(event.id, { treeId: event.treeId }).subscribe();
  }
}
