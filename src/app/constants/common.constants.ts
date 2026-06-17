export enum PropertyTypeEnum {
  Number = 'number',
  String = 'string',
  Boolean = 'boolean',
}
export type PropertyValueType = number | string | boolean | null;

export enum ReplaceTilePropertiesEnum {
  REPLACE = 'replace',
  MERGE = 'merge',
}

export type PropertiesType = Record<
  string,
  {
    type: PropertyTypeEnum;
    value: PropertyValueType;
  }
>;

export interface IProperty {
  key: string;
  type: PropertyTypeEnum;
  value: PropertyValueType;
}
