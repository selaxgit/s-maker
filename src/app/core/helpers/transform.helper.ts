import { SUNumberHelper } from '@selax/utils';

import { PropertiesType } from '~constants/common.constants';
import { FlatPropertiesType } from '~core/constants/export.constants';

export class TransformHelper {
  public static propertiesToFlat(properties: PropertiesType): FlatPropertiesType {
    const ret: FlatPropertiesType = {};
    Object.keys(properties).forEach((key: string) => {
      switch (properties[key].type) {
        case 'boolean':
          ret[key] = Boolean(properties[key].value);
          break;
        case 'number':
          ret[key] =
            properties[key].value === null ? null : SUNumberHelper.strToNumber(String(properties[key].value), 0);
          break;
        default:
          ret[key] = String(properties[key].value);
      }
    });
    return ret;
  }
}
