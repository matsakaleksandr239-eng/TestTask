class CountryValue {
  constructor(
    readonly iso: string,
    readonly code: string
  ) {}

  toString(): string {
    return this.iso;
  }
}

export const Country = {
  UA: new CountryValue('ua', '380'),
} as const;

export type TCountry = (typeof Country)[keyof typeof Country];
