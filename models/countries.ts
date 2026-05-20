type CountrySpecs = Readonly<{
  weather: string;
  friendly: string;
  food: string;
  sea: string;
  coordinates: {
    latitude: string;
    longitude: string;
  };
}>;

export type Country = Readonly<{
  name: string;
  continent: string;
  specs: CountrySpecs;
}>;
