import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { type HttpRequest, type InspectorTab } from "./types";

type InspectorContentProps = {
  request: HttpRequest;
  tab: InspectorTab;
};

export const InspectorContent = memo(function InspectorContent({
  request,
  tab,
}: InspectorContentProps) {
  if (tab === "Issues") {
    return (
      <div className="inspector-content">
        <section className="finding-panel">
          <div>
            <Badge
              className={`risk risk-${request.risk.toLowerCase()}`}
              variant="outline"
            >
              {request.risk}
            </Badge>
            <strong>{request.issue.title}</strong>
          </div>
          <p>{request.issue.description}</p>
        </section>
        <section className="inspector-section">
          <div className="section-title">Summary</div>
          <div className="property-list">
            <div className="property-row">
              <span>Host</span>
              <code>{request.host}</code>
            </div>
            <div className="property-row">
              <span>Status</span>
              <strong>{request.status}</strong>
            </div>
            <div className="property-row">
              <span>Type</span>
              <code>{request.type}</code>
            </div>
            <div className="property-row">
              <span>Round trip</span>
              <strong>{request.time}</strong>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const rows =
    tab === "Headers"
      ? request.headers
      : tab === "Params"
        ? request.params
        : request.cookies;

  return (
    <div className="inspector-content">
      {rows.length > 0 ? (
        <table className="inspector-table">
          <tbody>
            {rows.map(([name, value]) => (
              <tr key={name}>
                <th>{name}</th>
                <td>
                  <code>{value}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          <strong>Empty</strong>
          <span>No {tab.toLowerCase()} values.</span>
        </div>
      )}
    </div>
  );
});
