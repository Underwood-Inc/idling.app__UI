import './FilterBar.css';
export interface Filter {
  name: string;
  value: string;
}

type DefaultFilters = Record<string, string>;
export type Filters<
  F extends Partial<DefaultFilters> = Partial<DefaultFilters>
> = F;

function FilterLabel({ label }: { label: string }) {
  return <div className="filter-bar__filter-value">{label}</div>;
}

export default async function FilterBar({ filters }: { filters?: Filter[] }) {
  if (!filters?.length) {
    return null;
  }

  return (
    <article className="filter-bar__container">
      {filters.map(({ name, value }) => {
        const values: string[] = [];

        if (value.includes(',')) {
          values.push(...value.split(','));
        } else {
          values.push(value);
        }

        const renderValues = () =>
          values.map((value) => <FilterLabel key={value} label={value} />);

        return (
          <div key={name} className="filter-bar__filter">
            <div className="filter-bar__filter-name">
              {name}:&nbsp;{renderValues()}
            </div>
          </div>
        );
      })}
    </article>
  );
}
