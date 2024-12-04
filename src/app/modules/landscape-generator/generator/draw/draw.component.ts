import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppPixi } from '../../../../common/classes';
import { SMCScaleButtonsComponent } from '../../../../common/components';
import { LandscapeType } from '../../../../common/interfaces';
import { GeneratorService } from '../generator.service';
import { DrawContainer } from './draw.container';

@Component({
    selector: 'lg-generator-draw',
    imports: [CommonModule, SMCScaleButtonsComponent],
    templateUrl: './draw.component.html',
    styleUrl: './draw.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LGGeneratorDrawComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pixiContainer') pixiContainerRef!: ElementRef<HTMLDivElement>;

  private readonly appPixi = new AppPixi();

  private readonly drawContainer = new DrawContainer();

  private destroyRef$ = inject(DestroyRef);

  constructor(public readonly generatorService: GeneratorService) {}

  ngAfterViewInit(): void {
    this.initializePixi();
  }

  ngOnDestroy(): void {
    this.appPixi.destroy();
  }

  private initializePixi(): void {
    this.appPixi.useScale = true;
    this.appPixi.initialize(this.pixiContainerRef.nativeElement).then(() => {
      this.appPixi.attachScaleContainer(this.drawContainer);
      this.generatorService.map$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((map: LandscapeType) => {
        this.drawContainer.drawMap(map);
      });
    });
  }
}
