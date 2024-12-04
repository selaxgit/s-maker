import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { JSTTouchspinModule } from '@jst/ui';

import { NumberHelper } from '../../../../common/helpers';
import { GeneratorService } from '../generator.service';

@Component({
    selector: 'lg-generator-params',
    imports: [CommonModule, MatButtonModule, MatIconModule, ReactiveFormsModule, JSTTouchspinModule],
    templateUrl: './params.component.html',
    styleUrl: './params.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LGGeneratorParamsComponent {
  constructor(public readonly generatorService: GeneratorService) {}

  onShuffleSidControl(controlName: string): void {
    const MAX_SID = 999999;
    this.generatorService.paramsFormGroup.get(controlName)?.setValue(NumberHelper.getRandomInt(1, MAX_SID));
  }
}
