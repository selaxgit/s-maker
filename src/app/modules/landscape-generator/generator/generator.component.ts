import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { JSTDialogService } from '@jst/ui';

import { SMCHeaderComponent, SMCPageNotFoundComponent } from '../../../common/components';
import { APP_TITLE, LANDSCAPE_GENERATOR_MODULE } from '../../../common/constants';
import { IProject } from '../../../common/interfaces';
import { ProjectStore } from '../../../stores';
import { LGGeneratorDrawComponent } from './draw/draw.component';
import { GeneratorService } from './generator.service';
import { LGGeneratorParamsComponent } from './params/params.component';

@Component({
    selector: 'lg-generator',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        SMCHeaderComponent,
        SMCPageNotFoundComponent,
        LGGeneratorDrawComponent,
        LGGeneratorParamsComponent,
    ],
    providers: [GeneratorService],
    templateUrl: './generator.component.html',
    styleUrl: './generator.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LGGeneratorComponent {
  readonly currentModule = LANDSCAPE_GENERATOR_MODULE;

  constructor(
    public readonly titleService: Title,
    public readonly projectStore: ProjectStore,
    private readonly activatedRoute: ActivatedRoute,
    private readonly jstDialogService: JSTDialogService,
    private readonly generatorService: GeneratorService,
  ) {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed()).subscribe((params: ParamMap) => {
      this.projectStore.initialize(params.get('pid'));
    });
    this.projectStore.project$.pipe(takeUntilDestroyed()).subscribe((project: IProject | null) => {
      if (project) {
        this.titleService.setTitle(`${this.currentModule.name} | ${project.name ?? ''} | ${APP_TITLE}`);
      }
    });
    this.generatorService.isGenerating$.pipe(takeUntilDestroyed()).subscribe((value: boolean) => {
      if (value) {
        this.jstDialogService.showWait('Идет генерация ландшафта....');
      } else {
        this.jstDialogService.hideWait();
      }
    });
  }
}
