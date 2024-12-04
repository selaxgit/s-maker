import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { IJSTSelectItem, JSTFormControl, JSTSelectModule, JSTTouchspinModule } from '@jst/ui';
import { finalize } from 'rxjs';

import { ISceneObject, ISpriteAnimation, ISpriteInfo, SMModeCodesEnum } from '../../../../../common/interfaces';
import { SpritesService } from '../../../../../common/services/sprites';
import { ScenesStore } from '../../../../../stores/scenes.store';

@Component({
    selector: 'sb-edit-sidebar-current-object',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        RouterLink,
        JSTTouchspinModule,
        JSTSelectModule,
    ],
    templateUrl: './current-object.component.html',
    styleUrl: './current-object.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBEditSidebarCurrentObjectComponent implements OnInit {
  routeSprite = SMModeCodesEnum.spriteCollection;

  routeGrid = SMModeCodesEnum.tilesGridEditor;

  formGroup = new FormGroup({
    id: new JSTFormControl(null),
    sceneId: new JSTFormControl(null),
    x: new JSTFormControl(null),
    y: new JSTFormControl(null),
    zIndex: new JSTFormControl(null),
    visible: new JSTFormControl(null),
    width: new JSTFormControl(null),
    height: new JSTFormControl(null),
    playing: new JSTFormControl(false),
  });

  isLoading: WritableSignal<boolean> = signal(false);

  optionsAnimations: IJSTSelectItem[] = [];

  controlAnimation = new JSTFormControl(null);

  animPlayDisabled: WritableSignal<boolean> = signal(false);

  animStopDisabled: WritableSignal<boolean> = signal(false);

  private readonly destroyRef$ = inject(DestroyRef);

  private spriteInfo: ISpriteInfo | null = null;

  constructor(
    public readonly scenesStore: ScenesStore,
    private readonly spritesService: SpritesService,
  ) {}

  ngOnInit(): void {
    this.scenesStore.editorCurrentSceneObject$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((object: ISceneObject | null) => {
        if (object) {
          if (object.type === 'sprite') {
            if (this.spriteInfo?.spriteInfo.id !== object.referenceId) {
              this.fetchSpriteAnimation(object);
              return;
            }
          }
          this.formGroup.patchValue(object);
        } else {
          this.formGroup.reset();
        }
      });
    this.controlAnimation.valueChanges.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe(() => {
      this.setAnimationButtons();
    });
  }

  onSetAnimationPlay(value: boolean): void {
    this.formGroup.controls.playing.setValue(value);
    this.onChangeForm();
  }

  onChangeForm(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any = this.formGroup.getRawValue();
    const id = values.id;
    const sceneId = values.sceneId;
    delete values.id;
    delete values.sceneId;
    values.animationId = this.hasAnimation(this.controlAnimation.value) ? this.controlAnimation.value : null;
    this.scenesStore.updateSceneObject(sceneId, id, values);
  }

  private hasAnimation(id: number): boolean {
    return (this.spriteInfo?.spriteAnimation || []).some((i: ISpriteAnimation) => i.id === id);
  }

  private setAnimationButtons(): void {
    if (this.optionsAnimations.length === 0) {
      this.animPlayDisabled.set(true);
      this.animStopDisabled.set(true);
      return;
    }
    const animationId = this.controlAnimation.value;
    const playing = this.formGroup.controls.playing.value;
    const animation = this.spriteInfo?.spriteAnimation.find((i: ISpriteAnimation) => i.id === animationId);
    if (animation) {
      if (animation.layers.length < 2 && animation.layers[0].frames.length < 2) {
        this.animPlayDisabled.set(true);
        this.animStopDisabled.set(true);
      } else if (playing) {
        this.animPlayDisabled.set(true);
        this.animStopDisabled.set(false);
      } else {
        this.animPlayDisabled.set(false);
        this.animStopDisabled.set(true);
      }
    }
  }

  private fetchSpriteAnimation(object: ISceneObject): void {
    if (!object.referenceId) {
      return;
    }
    this.isLoading.set(true);
    this.spritesService
      .getSpriteInfo(object.referenceId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((info: ISpriteInfo) => {
        this.spriteInfo = info;
        this.formGroup.patchValue(object);
        this.optionsAnimations = info.spriteAnimation.map((i: ISpriteAnimation) => ({
          value: i.id,
          title: i.name,
        }));
        if (!object.animationId) {
          const defAnim = info.spriteAnimation.find((i: ISpriteAnimation) => i.default);
          if (defAnim) {
            this.controlAnimation.setValue(defAnim.id);
          }
        } else {
          this.controlAnimation.setValue(object.animationId);
        }
      });
  }
}
