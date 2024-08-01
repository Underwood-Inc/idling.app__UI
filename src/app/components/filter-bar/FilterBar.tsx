export interface Filter {
  name: string;
  value: string;
}

type DefaultFilters = Record<string, string>;
export type Filters<
  F extends Partial<DefaultFilters> = Partial<DefaultFilters>
> = F;

export default async function FilterBar({ filters }: { filters?: Filter[] }) {
  if (!filters?.length) {
    return null;
  }

  return (
    <div className="filter-bar__container">
      {filters.map(({ name, value }) => {
        const values: string[] = [];

        if (value.includes(',')) {
          values.push(...value.split(','));
        }

        const renderValues = () =>
          values.map((value) => (
            <span key={value} className="filter-bar__filter-value">
              {value}
            </span>
          ));

        return (
          <div key={name} className="filter-bar__filter">
            <p className="filter-bar__filter-name">
              {name}: {renderValues()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
