import { memo } from "react";

type ModulePlaceholderProps = {
  module: string;
};

const moduleRows = [
  ["state", "idle"],
  ["scope", "none"],
  ["updated", "-"],
];

export const ModulePlaceholder = memo(function ModulePlaceholder({
  module,
}: ModulePlaceholderProps) {
  return (
    <section className="workspace module-placeholder">
      <aside className="module-placeholder-sidebar panel">
        <div className="panel-header">
          <strong>{module}</strong>
          <span>Local</span>
        </div>
        <div className="placeholder-nav">
          <button className="placeholder-nav-row selected" type="button">
            Overview
          </button>
          <button className="placeholder-nav-row" type="button">
            Activity
          </button>
          <button className="placeholder-nav-row" type="button">
            Settings
          </button>
        </div>
      </aside>
      <section className="module-placeholder-main panel">
        <div className="panel-header">
          <strong>Overview</strong>
          <span>{module}</span>
        </div>
        <div className="module-placeholder-body">
          <div className="empty-state module-empty-state">
            <strong>No data</strong>
            <span>{module.toLowerCase()} source not configured.</span>
          </div>
          <table className="placeholder-table">
            <tbody>
              {moduleRows.map(([name, value]) => (
                <tr key={name}>
                  <th>{name}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
});
