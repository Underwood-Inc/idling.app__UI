import './FilterBar.css';
export interface Filter<T extends string = string> {
  name: T;
  value: string;
}

type DefaultFilters = Record<string, string>;
/**
 * Primary use is to define component props.
 * @example type PostsFilters = Filters<{ tags?: string; }>;
 */
export type Filters<
  F extends Partial<DefaultFilters> = Partial<DefaultFilters>
> = F;

function FilterLabel({ label }: { label: string }) {
  return <p className="filter-bar__filter-value">{label}</p>;
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
              <p>{name}:</p>&nbsp;{renderValues()}
            </div>
          </div>
        );
      })}
    </article>
  );
}
